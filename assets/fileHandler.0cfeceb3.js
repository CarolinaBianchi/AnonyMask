import{p as s}from"./index.60b33375.js";const d=async(a,o)=>{const e=document.createElement("canvas");e.width=a.current.naturalWidth,e.height=a.current.naturalHeight,e.getContext("2d",{willReadFrequently:!0}).drawImage(a.current,0,0),await s(e,o,[1,1]);const n=await new Promise(t=>e.toBlob(t,"image/png")),r={types:[{description:"PNG file",accept:{"image/png":[".png"]}}]};try{const c=await(await window.showSaveFilePicker(r)).createWritable();await c.write(n),await c.close(),console.log("File saved successfully!")}catch(t){console.error("Save operation was cancelled or failed:",t)}};export{d as saveFile};
