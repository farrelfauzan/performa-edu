import {
  Content,
  ContentMedia,
} from '@performa-edu/proto-types/content-service';
import {
  DefaultsSchema,
  NestedDefaults,
  ProtoHelper,
} from '@performa-edu/libs';

/** Default values for ContentMedia proto */
const contentMediaDefaults: DefaultsSchema<ContentMedia> = {
  hlsUrl: null,
  processedAt: null,
  deletedAt: null,
};

/** Default values for Content proto */
const contentDefaults: DefaultsSchema<Content> = {
  contentMedias: [],
  publishedAt: null,
  deletedAt: null,
};

/** Nested configuration for Content proto */
const contentNestedConfig: NestedDefaults<Content> = {
  contentMedias: { defaults: contentMediaDefaults },
};

export const ContentHelper = {
  normalize(content: Content | undefined | null): Content | null {
    return ProtoHelper.normalize<Content>(content, {
      defaults: contentDefaults,
      nested: contentNestedConfig,
    });
  },

  normalizeMany(contents: Content[] | undefined | null): Content[] {
    return ProtoHelper.normalizeMany<Content>(contents, {
      defaults: contentDefaults,
      nested: contentNestedConfig,
    });
  },

  toJSON(content: Content | undefined | null): Content | null {
    return this.normalize(content);
  },

  toJSONMany(contents: Content[] | undefined | null): Content[] {
    return this.normalizeMany(contents);
  },
};

export const ContentMediaHelper = {
  normalize(media: ContentMedia | undefined | null): ContentMedia | null {
    return ProtoHelper.normalize<ContentMedia>(media, {
      defaults: contentMediaDefaults,
    });
  },

  toJSON(media: ContentMedia | undefined | null): ContentMedia | null {
    return this.normalize(media);
  },
};
