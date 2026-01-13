package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsFeed(
    val metadata: OpdsFeedMetadata,
    val links: List<ReadiumLink>,
    val navigation: List<ReadiumLink>? = null,
)