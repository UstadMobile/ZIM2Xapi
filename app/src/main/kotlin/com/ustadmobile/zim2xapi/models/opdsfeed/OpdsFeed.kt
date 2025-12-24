package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsFeed(
    val metadata: OpdsFeedMetadata,
    val links: List<ReadiumLink>,
    val publications: List<OpdsPublication>? = null,
    val navigation: List<ReadiumLink>? = null,
) {
    companion object {
        const val MEDIA_TYPE = "application/opds+json"
    }
}