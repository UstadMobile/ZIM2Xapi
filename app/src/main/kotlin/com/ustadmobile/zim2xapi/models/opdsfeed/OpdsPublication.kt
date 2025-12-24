package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsPublication(
    val metadata: ReadiumMetadata,
    val links: List<ReadiumLink>,
    val images: List<ReadiumLink>? = null,
) {
    companion object {
        const val MEDIA_TYPE = "application/opds-publication+json"

        const val MEDIA_TYPE_READIUM_MANIFEST = "application/webpub+json"
    }
}
