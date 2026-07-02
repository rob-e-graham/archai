import { repo } from './objectRepository.js';
import { listPublishedMedia } from './mediaPublishService.js';

export function buildNfcPageModel(tag) {
  if (!tag.objectId) {
    return {
      tagId: tag.tagId,
      title: 'Unassigned AUX.IO Tag',
      type: 'AUX.IO Placeholder',
      year: null,
      location: tag.location,
      story: 'This tag is currently unassigned. Staff can assign an object in the ARCHAI AUX.IO tab.',
      chips: ['Assign in Admin', 'Scan test', 'Open object search'],
    };
  }

  const objectRecord = repo.getObject(tag.objectId);
  const media = Array.isArray(objectRecord?.media) ? objectRecord.media : [];
  const hero = media.find((m) => m.kind === 'image' && (m.thumbUrl || m.url));
  return {
    tagId: tag.tagId,
    title: objectRecord?.title || 'Unknown object',
    type: objectRecord?.type || 'Unknown type',
    year: objectRecord?.year,
    location: tag.location,
    story: objectRecord?.aiInterpretation || objectRecord?.description || 'No curatorial story published yet.',
    heroImage: hero ? (hero.thumbUrl || hero.url) : null,
    institution: objectRecord?.source?.institution || null,
    rights: objectRecord?.source?.rights || null,
    accession: objectRecord?.source?.accessionNumber || null,
    verifiedFacts: Array.isArray(objectRecord?.verifiedFacts) ? objectRecord.verifiedFacts : [],
    publishedMedia: listPublishedMedia({ objectId: tag.objectId, status: 'published' }),
    chips: [
      'Ask this work a question',
      'How was it made?',
      'What is preserved?',
      'What is unknown?',
    ],
  };
}
