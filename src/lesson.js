import { vocabulary } from './vocabulary.js';

export const chapters = [
  { name: 'The Footprint Garden', subtitle: 'Every step leaves a trace.', terms: [17, 0, 34, 29, 10, 25, 32, 36, 37] },
  { name: 'The Hall of Mirrors', subtitle: 'Question what the mirrors show you.', terms: [28, 30, 15, 6, 42, 5, 9, 19, 4, 22] },
  { name: 'The Citizens’ Court', subtitle: 'Choose the kind of traveler you will be.', terms: [16, 18, 20, 7, 31, 14, 1] },
  { name: 'The Forge of Ideas', subtitle: 'Honor the makers who came before.', terms: [24, 11, 12, 2, 13, 21, 39, 38, 41, 26, 35, 43] },
  { name: 'The Sanctum of Trust', subtitle: 'Restore the three promises of the archive.', terms: [8, 23, 3, 27, 44, 33, 40] },
];

// Applied situations are original; definitions and all 45 terms follow the supplied list.
const situations = [
  'You deliberately publish a comment and upload a photo. What kind of trail are you creating?',
  'An image needs a written description so a screen reader can explain it. What should you add?',
  'You name the photographer beside an image you are allowed to reuse. What are you providing?',
  'Authorized students can open the learning system whenever they need it. Which promise is being kept?',
  'You accept a claim because everyone in your group already agrees with it. Which influence is at work?',
  'A report highlights one side of an issue while leaving out evidence from the other. What does it show?',
  'A headline promises a shocking secret simply to get you to open the page. What is this tactic?',
  'Your technology club adopts written standards to guide its online behavior. What has it created?',
  'Only the people with permission can read a student record. Which promise is being kept?',
  'You keep the sources that support your opinion and ignore evidence that challenges it. What is this tendency?',
  'A website saves a small text file to remember your preferences. What is that file called?',
  'A creator automatically gains legal control over copying an original work. What is this protection?',
  'Someone uses a protected illustration without permission or the necessary rights. What has occurred?',
  'A creator chooses a license framework that lets others share or remix with attribution. Which framework is it?',
  'A classmate repeatedly uses messages to harass another student. What is this behavior?',
  'An AI-edited clip replaces a speaker’s voice and face to make a fabricated scene look real. What is it?',
  'Someone joins and participates in online communities. What does that make the person?',
  'Your posts, browsing records, and other online activity leave a trail of data. What is the overall trail called?',
  'People have legal rights to access, use, and create digital content. What are these rights called?',
  'An online group shows almost nothing but opinions its members already hold. What kind of space is it?',
  'A learner follows principles of responsibility and trust in their choices. What guides those behaviors?',
  'A teacher considers the copyright exception that can permit limited excerpts for criticism or teaching. Which concept is relevant?',
  'A popular athlete gives technology advice. You assume it is correct because the athlete excels at sport. Which effect is this?',
  'A record remains accurate and changes only when an authorized person edits it. Which promise is being kept?',
  'A song, an invention, and a brand symbol are all creations of the mind. What category includes them?',
  'A network identifies a device with a logical number under the Internet Protocol. What is that number called?',
  'A contract explains who may use a program and the conditions they must follow. What is it?',
  'A program is designed to steal data and damage devices. What kind of software is it?',
  'Before sharing a claim, you evaluate the source and question the evidence. Which ability are you using?',
  'A photo contains information about when and where it was taken. What is this information about the file called?',
  'An inaccurate claim spreads, even though some people sharing it do not intend to deceive. What is it?',
  'You use courteous language and respectful online manners. What are you practicing?',
  'Posts by you and others shape a version of yourself that exists online. What is that version called?',
  'A program’s source code is available for anyone to view, change, and share. Which software category is this?',
  'A service automatically records your location and IP logs without you posting them. What kind of trail is it collecting?',
  'An inventor obtains an approved protection against others using or selling the invention. What is it?',
  'The image and reputation you have built online form a recognizable impression of you. What is that impression?',
  'You intentionally choose posts that reflect your values and goals. What process are you carrying out?',
  'Someone copies and distributes protected media without the rights to do so. Which term describes this unauthorized use?',
  'A student submits another writer’s paragraphs as if the student wrote them. What is this act?',
  'A publisher retains the source-code rights and sells permission to use a program. Which software category is it?',
  'A work’s copyright has expired or been given up, making it freely usable. Where does it belong?',
  'A post is designed to provoke anger so readers react and share it. What is this tactic?',
  'A registered company name or logo identifies a business’s product. What kind of protection is it?',
  'A service encrypts traffic and sends it through a secure tunnel. Which service is this?',
];

export function chapterTrials(chapter) {
  const terms = chapters[chapter].terms;
  return Array.from({ length: 3 }, (_, i) => terms.slice(Math.floor(i * terms.length / 3), Math.floor((i + 1) * terms.length / 3)));
}

export function makeQuestion(id) {
  const entry = vocabulary[id];
  const chapter = chapters.find(c => c.terms.includes(id));
  const distractors = chapter.terms.filter(value => value !== id);
  const selected = [id, distractors[(id * 2) % distractors.length], distractors[(id * 2 + 1) % distractors.length], distractors[(id * 2 + 2) % distractors.length]];
  const rotate = id % 4;
  const ids = [...selected.slice(rotate), ...selected.slice(0, rotate)];
  const mode = id % 3;
  return {
    id, mode,
    type: ['Decode the inscription', 'Read the situation', 'Choose the meaning'][mode],
    prompt: mode === 0 ? `Which term matches this inscription? “${entry.definition}”` : mode === 1 ? situations[id] : `What does “${entry.term}” mean?`,
    options: ids.map(value => ({ id: value, text: mode === 2 ? vocabulary[value].definition : vocabulary[value].term })),
    explanation: `${entry.term}: ${entry.definition}`,
  };
}

export { vocabulary };
