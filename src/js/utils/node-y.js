export default function nodeY(node){
  let offset = node.offsetTop;

  while (node = node.offsetParent){
    offset += node.offsetTop;
  }

  return offset;
}
