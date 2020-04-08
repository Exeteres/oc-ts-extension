import {
    DebugAdapterDescriptorFactory,
    DebugAdapterInlineImplementation,
    ProviderResult,
    DebugAdapterDescriptor
} from "vscode";
import { LuaDebugSession } from "./luaDebugSession";

export class LuaDebugAdapterFactory implements DebugAdapterDescriptorFactory {
    public createDebugAdapterDescriptor(): ProviderResult<DebugAdapterDescriptor> {
        return new DebugAdapterInlineImplementation(new LuaDebugSession());
    }
}
