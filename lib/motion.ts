export {};
declare global{interface Window{KaloreMotion?:{init:(scope?:ParentNode)=>()=>void;enter:(element:Element|null)=>void;feedback:(target:Element|null,correct:boolean,detail?:string)=>void;reduced:()=>boolean}}}
