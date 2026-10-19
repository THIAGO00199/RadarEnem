"""Build ATENA's public course catalog from unmodified official MEC workbooks.

Python standard library only. The workbooks contain course aggregates, never
applicant records. Download is explicit; normal site builds use the saved JSON.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from zipfile import ZipFile

SOURCES = {
    'cutoffs': 'https://sisu.mec.gov.br/static/pdf/Portal%20Sisu_%20Sisu2026_inscri%C3%A7%C3%B5es%20e%20notas%20de%20corte.xlsx',
    'rules': 'https://sisu.mec.gov.br/static/pdf/Portal_Sisu_2026_Vagas%20ofertadas.xlsx',
}
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
AREAS = ['LINGUAGENS', 'CIENCIAS_HUMANAS', 'CIENCIAS_NATUREZA', 'MATEMATICA', 'REDACAO']
ROOT = Path(__file__).resolve().parent.parent


def rows(path):
    with ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            with archive.open('xl/sharedStrings.xml') as stream:
                for _, element in ET.iterparse(stream, events=('end',)):
                    if element.tag.endswith('}si'):
                        shared.append(''.join(element.itertext()))
                        element.clear()
        # Both official files expose their dictionary first, aggregates second.
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        sheets = workbook.find('m:sheets', NS)
        if sheets is None or len(sheets) < 2:
            raise ValueError('Expected dictionary and aggregate sheets')
        rid = sheets[1].attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        relations = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        target = next(item.attrib['Target'] for item in relations if item.attrib['Id'] == rid)
        target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        with archive.open(target) as stream:
            header = None
            for _, element in ET.iterparse(stream, events=('end',)):
                if not element.tag.endswith('}row'):
                    continue
                cells = {}
                for cell in element:
                    column = ''.join(c for c in cell.attrib.get('r', '') if c.isalpha())
                    index = 0
                    for letter in column:
                        index = index * 26 + ord(letter) - 64
                    raw = cell.find('m:v', NS)
                    value = raw.text if raw is not None else None
                    kind = cell.attrib.get('t')
                    if kind == 's' and value is not None:
                        value = shared[int(value)]
                    elif kind == 'inlineStr':
                        value = ''.join(cell.find('m:is', NS).itertext())
                    elif value is not None and kind not in ('str', 'e'):
                        value = float(value)
                        if value.is_integer():
                            value = int(value)
                    cells[index - 1] = value.strip() if isinstance(value, str) else value
                values = [cells.get(index) for index in range(max(cells, default=-1) + 1)]
                if header is None:
                    header = values
                elif values and values[0] is not None:
                    yield dict(zip(header, values + [None] * (len(header) - len(values))))
                element.clear()


def number(value):
    if not isinstance(value, (int, float)) or value < 0 or value != value:
        raise ValueError('Invalid official numeric value: ' + str(value))
    return value


def key(row, field):
    return tuple(row[name] for name in ('CO_IES', 'CO_IES_CURSO', 'NO_CAMPUS', 'DS_TURNO', 'DS_GRAU', 'TP_MOD_CONCORRENCIA')) + (str(row[field]).strip(),)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    args.source_dir.mkdir(parents=True, exist_ok=True)
    files = {'cutoffs': args.source_dir / 'sisu-2026-cortes.xlsx', 'rules': args.source_dir / 'sisu-2026-vagas.xlsx'}
    if args.download:
        for name, url in SOURCES.items():
            request = Request(url, headers={'User-Agent': 'ATENA-Course-Catalog/1.0'})
            with urlopen(request, timeout=90) as response:
                body = response.read(75_000_001)
            if len(body) > 75_000_000:
                raise ValueError('Source file too large')
            files[name].write_bytes(body)
    rules = {}
    for row in rows(files['rules']):
        row_key = key(row, 'TP_COTA')
        if row_key in rules:
            raise ValueError('Duplicate course/modality in rules')
        rules[row_key] = row
    institutions, modalities, offers = {}, {}, {}
    used = set()
    positive, absent = 0, 0
    for row in rows(files['cutoffs']):
        row_key = key(row, 'TIPO_CONCORRENCIA')
        if row_key in used or row_key not in rules:
            raise ValueError('Course/modality join is not one-to-one')
        used.add(row_key)
        rule = rules[row_key]
        institution = int(row['CO_IES'])
        institutions[institution] = {'id': institution, 'name': row['NO_IES'], 'acronym': row['SG_IES']}
        code, description = str(row['TIPO_CONCORRENCIA']).strip(), row['DS_MOD_CONCORRENCIA']
        modality_key = (code, description)
        if modality_key not in modalities:
            modalities[modality_key] = len(modalities)
        offer_key = row_key[:4]
        weights = [number(rule['PESO_' + area]) for area in AREAS]
        minimums = [number(rule['NOTA_MINIMA_' + area]) for area in AREAS]
        mean = number(rule['NU_MEDIA_MINIMA_ENEM'])
        if sum(weights) <= 0:
            raise ValueError('Invalid zero weight total')
        if offer_key not in offers:
            offers[offer_key] = {'id': sha256(json.dumps(offer_key, ensure_ascii=False).encode()).hexdigest()[:16], 'institution': institution, 'courseCode': row['CO_IES_CURSO'], 'course': row['NO_CURSO'], 'campus': row['NO_CAMPUS'], 'city': row['NO_MUNICIPIO_CAMPUS'], 'state': row['SG_UF_CAMPUS'], 'degree': row['DS_GRAU'], 'shift': row['DS_TURNO'], 'weights': weights, 'minimums': minimums, 'minimumAverage': mean, 'references': []}
        offer = offers[offer_key]
        if (offer['weights'], offer['minimums'], offer['minimumAverage']) != (weights, minimums, mean):
            raise ValueError('Rules differ between modalities; schema needs a per-modality rule set')
        cutoff = number(row['NU_NOTACORTE'])
        positive += cutoff > 0
        absent += cutoff == 0
        # A zero in this report is not an admission reference of zero points.
        offer['references'].append([modalities[modality_key], cutoff if cutoff > 0 else None, number(row['QT_VAGAS_CONCORRENCIA']), number(row['NU_PERCENTUAL_BONUS'])])
    if used != set(rules):
        raise ValueError('Unmatched aggregate records remain')
    output = {'version': 1, 'year': 2026, 'stage': 'chamada-regular', 'checkedAt': datetime.now(timezone.utc).isoformat(), 'sources': {name: {'url': SOURCES[name], 'sha256': sha256(path.read_bytes()).hexdigest()} for name, path in files.items()}, 'rawEdition': {'cutoffs': 302, 'rules': 2026}, 'counts': {'records': len(used), 'institutions': len(institutions), 'offers': len(offers), 'positiveReferences': positive, 'missingReferences': absent}, 'institutions': list(institutions.values()), 'modalities': [{'code': code, 'description': description} for code, description in modalities], 'offers': list(offers.values())}
    output['states'] = dict(sorted(Counter(offer['state'] for offer in offers.values()).items()))
    destination = ROOT / 'portable/public/data/sisu-catalog-2026.json'
    temporary = destination.with_suffix('.tmp')
    temporary.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
    temporary.replace(destination)
    summary = {key: output[key] for key in ('version', 'year', 'stage', 'checkedAt', 'sources', 'rawEdition', 'counts', 'states')}
    summary['notes'] = ['Nota do último classificado na última vaga da chamada regular; não é previsão.', 'Zero no arquivo de cortes é tratado como referência ausente.', 'Média mínima usa as cinco notas sem pesos; classificação usa os pesos do curso.', 'Bônus pode ter vagas compartilhadas com AC; não somar vagas de modalidades.', 'Sem dados pessoais de candidatos.']
    (ROOT / 'data/catalogs/sisu-2026-provenance.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'catalog': str(destination), 'bytes': destination.stat().st_size, **output['counts']}, ensure_ascii=False))

if __name__ == '__main__':
    main()
