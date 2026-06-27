package com.virtualdroid.modules

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class VirtualDroidPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> {
        return listOf(
            VirtualCoreModule(context),
            DeviceSpoofingModule(context),
        )
    }

    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
