const o=new MutationObserver(m=>{
  m.forEach(r=>{
    r.addedNodes.forEach(n=>{
      if(n.tagName==="IMG") n.loading="lazy";
      n.querySelectorAll?.("img").forEach(i=>i.loading="lazy");
    });
  });
});
o.observe(document.documentElement,{childList:true,subtree:true});