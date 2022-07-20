// function nodePath(baseNode, targetNode, currentPath = []) {
//   currentPath.unshift(targetNode);
//   if (targetNode == baseNode) return currentPath;
//   return nodePath(baseNode, targetNode.parentNode, currentPath);
// }

window.addEventListener("load", function(){
  const table = document.querySelector('table')
  table.style.display = "table"

  // table.addEventListener("click", (event) => {
  //   const path   = nodePath(event.currentTarget, event.target);
  //   const parent = path.find(node => node.matches("tr"));

  //   if (!parent) {
  //     console.log("It Worked!");
  //     return
  //   }

  //   const text = parent.dataset.id
  //   console.log(text)

  //   window.open(`./show.html#${encodeURIComponent(text)}`, '_blank')
  // })
});

