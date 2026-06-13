export type ScannedFile = {
  file: File;
  path: string;
};

export async function scanSvgFolder(
  folderHandle: any,
  options: {
    recursive: boolean;
  },
): Promise<ScannedFile[]> {
  const results: ScannedFile[] = [];
  await scanDirectory(folderHandle, "", results, options.recursive);
  return results;
}

async function scanDirectory(
  dirHandle: any,
  prefix: string,
  results: ScannedFile[],
  recursive: boolean,
): Promise<void> {
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "file" && name.toLowerCase().endsWith(".svg")) {
      const file = await handle.getFile();
      results.push({
        file,
        path: prefix ? `${prefix}/${name}` : name,
      });
    } else if (handle.kind === "directory" && recursive) {
      await scanDirectory(
        handle,
        prefix ? `${prefix}/${name}` : name,
        results,
        recursive,
      );
    }
  }
}
