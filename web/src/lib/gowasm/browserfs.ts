import {StackReader} from '~/lib/go';
import SyscallHelper from '~/lib/gowasm/syscall';
import {ExportMethod, Package, PackageBinding} from '~/lib/gowasm/binder';

@Package('github.com/x1unix/go-playground/internal/gowasm/browserfs')
export default class BrowserFSHost extends PackageBinding {

  constructor(private helper: SyscallHelper) {
    super();
  }

  @ExportMethod('stat')
  stat(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  @ExportMethod('readDir')
  readDir(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  @ExportMethod('readFile')
  readFile(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  @ExportMethod('writeFile')
  writeFile(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  @ExportMethod('makeDir')
  makeDir(sp: number, reader: StackReader) {
    reader.skipHeader();
  }

  @ExportMethod('unlink')
  unlink(sp: number, reader: StackReader) {
    reader.skipHeader();
  }
}
