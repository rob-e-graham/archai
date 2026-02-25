import { repo } from './objectRepository.js';
import { listPublishedMedia } from './mediaPublishService.js';

export function buildNfcPageModel(tag) {
  if (!tag.objectId) {
    return {
      tagId: tag.tagId,
      title: 'Unassigned NFC Tag',
      type: 'NFC Placeholder',
      year: null,
      location: tag.location,
      story: 'This tag is currently unassigned. Staff can assign an object in the ARCHAI NFC tab.',
      chips: ['Assign in Admin', 'Scan test', 'Open object search'],
    };
  }

  const objectRecord = repo.getObject(tag.objectId);
  return {
    tagId: tag.tagId,
    title: objectRecord?.title || 'Unknown object',
    type: objectRecord?.type || 'Unknown type',
    year: objectRecord?.year,
    location: tag.location,
    story: objectRecord?.aiInterpretation || objectRecord?.description || 'No curatorial story published yet.',
    publishedMedia: listPublishedMedia({ objectId: tag.objectId, status: 'published' }),
    chips: [
      'Ask this work a question',
      'How was it made?',
      'What is preserved?',
      'What is unknown?',
    ],
  };
}
