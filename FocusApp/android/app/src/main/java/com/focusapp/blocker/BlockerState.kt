package com.focusapp.blocker

object BlockerState {
    @Volatile var enabled: Boolean = false
    @Volatile var packages: Set<String> = emptySet()
}
