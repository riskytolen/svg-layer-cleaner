export function serializeSvg(doc: Document): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
