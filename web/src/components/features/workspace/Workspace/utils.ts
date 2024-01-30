const baseDirName = (fileName: string) => {
  const parts = fileName.split('/');
  parts.pop();

  return parts.pop();
}

export const newEmptyFileContent = (fileName: string) => {
  const pkg = baseDirName(fileName) ?? 'main';
  return `package ${pkg}\n\n`;
}
