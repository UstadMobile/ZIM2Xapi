package com.ustadmobile.zim2xapi

import kotlinx.serialization.Serializable

@Serializable
data class KolibriChannel(
    val labels: Labels
)

@Serializable
data class Labels(
    val channels: List<Channels>
)

@Serializable
data class Channels(
    val id: String,
    val name: String
)