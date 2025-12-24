package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsPublication(
    val metadata: ReadiumMetadata,
    val links: List<ReadiumLink>,
    val images: List<ReadiumLink>? = null,
)

