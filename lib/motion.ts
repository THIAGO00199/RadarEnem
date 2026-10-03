export {};
declare global{interface Window{KaloreMotion?:{init:(scope?:ParentNode)=>()=>void;enter:(element:Element|null)=>void;celebrate:(target:Element|null)=>void;answer:(target:Element|null,correct:boolean)=>void;feedback:(target:Element|null,correct:boolean,detail?:string)=>void;reduced:()=>boolean}}}
