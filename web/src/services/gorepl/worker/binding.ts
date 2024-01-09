import { Package, PackageBinding, WasmExport } from "~/lib/gowasm";
import {
  Bool,
  GoStringType,
  Int,
  MemoryView,
  StackReader,
  Struct,
  Uint8
} from "~/lib/go";
import { newPackageSymbolFunc } from "~/lib/gowasm/utils";
import { EvalEventHandler, EvalState, PackageManagerEvent } from "./types";

const pkgName = 'github.com/x1unix/go-playground/internal/gorepl/uihost';
const sym = newPackageSymbolFunc(pkgName);

/**
 * @see internal/gorepl/uihost/downloads.go
 */
const TPackageManagerEvent = Struct<PackageManagerEvent>(sym('packageManagerEvent'), [
  { key: 'eventType', type: Uint8 },
  { key: 'success', type: Bool },
  { key: 'processedItems', type: Int },
  { key: 'totalItems', type: Int },
  { key: 'context', type: GoStringType },
]);

/**
 * uihost binding
 *
 * @see internal/gorepl/uihost
 */
@Package(pkgName)
export class UIHostBinding extends PackageBinding {
  constructor(private handler: EvalEventHandler) {
    super();
  }

  // func onPackageManagerEvent(e packageManagerEvent)
  @WasmExport('onPackageManagerEvent')
  onPackageManagerEvent(sp: number, stack: StackReader, _: MemoryView) {
    stack.skipHeader();
    const event = stack.next<PackageManagerEvent>(TPackageManagerEvent);
    this.handler.onPackageManagerEvent(event);
  }

  // func onProgramEvalStateChange(state EvalState, msg string)
  @WasmExport('onProgramEvalStateChange')
  onProgramEvalStateChange(sp: number, stack: StackReader, _: MemoryView) {
    stack.skipHeader();
    const state = stack.next<EvalState>(Uint8);
    const message = stack.next<string>(GoStringType);

    this.handler.onProgramEvalStateChange({ state, message });
  }
}
