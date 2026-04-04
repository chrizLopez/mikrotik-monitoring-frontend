import{d as i,j as n,I as l}from"./index-8Fjxjwg0.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],x=i("download",u);function p({range:t,endpoint:s="/api/dashboard/export/users.csv",filename:a=`mikrotik-users-${t}.csv`,label:r="Export CSV"}){const c=async()=>{const d=await l(s,{range:t}),o=URL.createObjectURL(d),e=document.createElement("a");e.href=o,e.download=a,e.click(),URL.revokeObjectURL(o)};return n.jsxs("button",{type:"button",onClick:()=>void c(),className:"inline-flex items-center gap-2 rounded-xl border border-line/80 bg-surface-soft px-4 py-2 text-sm font-medium text-text transition hover:bg-surface",children:[n.jsx(x,{className:"h-4 w-4"}),r]})}export{p as E};
