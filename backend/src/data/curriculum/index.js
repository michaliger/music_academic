import { readFileSync } from 'fs';

// Course content is plain JSON data (course -> units -> lessons with blocks and quiz).
const FILES = ['01-basics', '02-scales-and-intervals', '03-harmony', '06-chord-construction', '08-advanced-harmony', '07-keys-and-modes', '04-composition', '10-chords-for-songs', '09-rhythm-form-arranging', '11-styles-and-eras', '05-ear-training'];
export const COURSES = FILES.map((name) => JSON.parse(readFileSync(new URL(`./${name}.json`, import.meta.url), 'utf8')));
