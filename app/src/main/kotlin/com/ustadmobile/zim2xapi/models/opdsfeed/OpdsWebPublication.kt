package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsWebPublication(
    val context: String,
    val metadata: OpdsWebMetadata,
    val links: List<OpdsWebPublicationLink>,
    val readingOrder: List<OpdsWebPublicationLink> = emptyList(),
    val resources: List<OpdsWebPublicationLink> = emptyList()
)

