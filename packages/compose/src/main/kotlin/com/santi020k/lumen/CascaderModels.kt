package com.santi020k.lumen

class LumenCascaderModel(nodes: List<LumenTreeNode>) {
    val tree = LumenTreeModel(nodes)
    fun canSelect(id: String): Boolean = tree.valid && tree.node(id)?.selectable == true &&
        !tree.isDisabled(id) && tree.childrenOf(id).isEmpty()
    fun isPathValid(path: List<String>): Boolean = tree.valid &&
        (path.isEmpty() || tree.path(path.last()).map { it.id } == path)
    fun selecting(id: String, current: List<String>): List<String> =
        if (canSelect(id)) tree.path(id).map { it.id } else current
}
