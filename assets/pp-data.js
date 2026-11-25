/* VistaEd · VISTA MYP Personal Project Hub · content (teacher-created by George Apidi). Loaded before pp.js.
   Global contexts, ATL skill clusters, idea categories, product formats, success-criteria types, source evaluation and
   report guidance. The assessment criteria and their official descriptors are NOT here: they live in pp_guides (database)
   and are entered from the IB MYP Projects guide. */
(function () {
  'use strict';
  var D = window.PPD = {};

  D.STAGES = [
    { k: 'intro', n: 'Introduction', ic: '🧭' }, { k: 'ideas', n: 'Project ideas', ic: '💡' }, { k: 'goal', n: 'Learning goal', ic: '🎯' },
    { k: 'context', n: 'Global context', ic: '🌍' }, { k: 'product', n: 'Product or outcome', ic: '🛠️' }, { k: 'criteria', n: 'Success criteria', ic: '✅' },
    { k: 'research', n: 'Research', ic: '🔎' }, { k: 'plan', n: 'Project plan', ic: '🗓️' }, { k: 'atl', n: 'ATL skills', ic: '🧠' },
    { k: 'journal', n: 'Process journal', ic: '📓' }, { k: 'develop', n: 'Product development', ic: '🧪' }, { k: 'evidence', n: 'Evidence portfolio', ic: '🗂️' },
    { k: 'report', n: 'Final report', ic: '📝' }];

  D.CATEGORIES = [
    ['science', '🔬 Science and technology', ['Build a low-cost water filter and test how clean it makes the water', 'Learn to code a plant-watering sensor with a microcontroller', 'Investigate which local plants have antibacterial properties']],
    ['environment', '🌱 Environmental sustainability', ['Design a composting system for the school canteen', 'Run a campaign to reduce single-use plastic at home and school', 'Grow a vertical garden from recycled bottles']],
    ['engineering', '⚙️ Engineering and innovation', ['Design and build a solar-powered phone charger', 'Make a working model of a wind turbine and measure its output', 'Design a low-cost prosthetic hand prototype with a 3D printer']],
    ['arts', '🎨 Arts and creativity', ['Compose and record an original song cycle', 'Illustrate a children’s picture book about an environmental issue', 'Learn traditional kanga design and make a collection']],
    ['health', '💚 Health and wellbeing', ['Create a nutrition guide for teenage athletes', 'Design a mindfulness programme for exam season', 'Learn first aid and make a training video for younger students']],
    ['education', '📚 Education', ['Create an interactive revision website for Grade 6 science', 'Teach basic coding to a group of primary pupils', 'Build a sign-language phrasebook for classmates']],
    ['community', '🤝 Community development', ['Organise a book drive and set up a reading corner in a local school', 'Map safe walking routes to school with local residents', 'Start a repair café for household items']],
    ['sports', '⚽ Sports', ['Design a 6-week training plan to improve my 1500 m time', 'Analyse my free-throw technique with video and improve it', 'Organise an inclusive sports day for students with disabilities']],
    ['digital', '💻 Digital technology', ['Build a mobile app that helps students track homework', 'Make a short animated film about my family history', 'Create a podcast series about young entrepreneurs']],
    ['enterprise', '💼 Entrepreneurship', ['Start a small business selling upcycled bags and plan its finances', 'Design and test a brand for a local food product', 'Create a business plan for a school tuck-shop']],
    ['culture', '🏺 Culture and heritage', ['Record and preserve stories from elders in my community', 'Learn to cook traditional Swahili dishes and publish a recipe book', 'Build a virtual museum of local historic sites']]];

  D.IDEA_SCORES = [['relevance', 'Personal relevance', 'How much does this matter to me?'], ['feasibility', 'Feasibility', 'Can I do it in the time, with my skills and at school or home?'], ['originality', 'Originality', 'Is it my own idea, not just copying a common project?'], ['resources', 'Available resources', 'Do I have, or can I get, the materials, people and money?'], ['time', 'Time requirements', 'Does it fit the months available (higher = fits better)?'], ['learning', 'Learning opportunities', 'Will I learn something genuinely new?'], ['atl', 'ATL skills', 'Will it let me show several ATL skills?']];

  D.CONTEXTS = [
    { k: 'ir', n: 'Identities and relationships', ic: '🧑‍🤝‍🧑', about: 'Who we are: identity, beliefs and values; personal, physical, mental, social and spiritual health; human relationships, including families, friends, communities and cultures; what it means to be human.',
      examples: ['Teenage mental health and social media', 'How sport shapes identity', 'Family traditions across generations'],
      projects: ['A wellbeing toolkit for Year 7 students', 'A short film about growing up between two cultures', 'A fitness programme for my family'],
      questions: ['How does my project relate to who people are or how they live together?', 'Whose wellbeing or relationships will it affect?', 'What does it reveal about identity or values?'] },
    { k: 'ost', n: 'Orientation in space and time', ic: '🧭', about: 'Personal histories; homes and journeys; turning points in humankind; discoveries, explorations and migrations; the relationships between individuals and civilizations from personal, local and global perspectives.',
      examples: ['Migration stories in my community', 'How a town changed over 100 years', 'The history of a local landmark'],
      projects: ['An oral-history archive of elders', 'A historical walking-tour map', 'A model of an ancient building'],
      questions: ['What happened in the past, and how does it connect to now?', 'How do place and movement shape my topic?', 'What turning points matter here?'] },
    { k: 'pce', n: 'Personal and cultural expression', ic: '🎭', about: 'The ways we discover and express ideas, feelings, nature, culture, beliefs and values; how we reflect on, extend and enjoy our creativity; our appreciation of the aesthetic.',
      examples: ['Traditional music and modern genres', 'Fashion as self-expression', 'Street art and community voice'],
      projects: ['Compose and perform an original piece', 'A photography exhibition', 'A collection of clothes using local fabrics'],
      questions: ['What am I expressing, and to whom?', 'How does culture influence the product?', 'How will I develop my creativity?'] },
    { k: 'sti', n: 'Scientific and technical innovation', ic: '🔬', about: 'How we understand the natural world and how humans use scientific principles; the impact of scientific and technological advances on communities and environments; how people adapt environments to their needs.',
      examples: ['Renewable energy for rural homes', 'Apps that solve everyday problems', 'Water purification'],
      projects: ['A solar cooker tested against criteria', 'A sensor that warns when plants need water', 'A low-cost microscope'],
      questions: ['Which scientific principle or technology does my project use?', 'What problem does it solve, for whom?', 'What are its impacts on people or the environment?'] },
    { k: 'gs', n: 'Globalization and sustainability', ic: '🌍', about: 'The interconnectedness of human-made systems and communities; the relationship between local and global processes; how local experiences mediate the global; the impact of decision-making on humankind and the environment.',
      examples: ['Plastic pollution on local beaches', 'Fast fashion and waste', 'Food miles and local farming'],
      projects: ['A school recycling system', 'A campaign on reusable bags', 'A guide to sustainable food at home'],
      questions: ['How does a global issue show up locally in my project?', 'What would make my product sustainable?', 'Who makes the decisions, and who is affected?'] },
    { k: 'fd', n: 'Fairness and development', ic: '⚖️', about: 'Rights and responsibilities; the relationship between communities; sharing finite resources with other people and other living things; access to equal opportunities; peace and conflict resolution.',
      examples: ['Access to education for girls', 'Disability inclusion in sport', 'Fair trade'],
      projects: ['A tutoring programme for younger pupils', 'An accessible playground design', 'A fundraising event with a clear impact goal'],
      questions: ['Who has less access, and why?', 'How does my project make something fairer?', 'What responsibilities do I have as I carry it out?'] }];

  D.ATL = [
    { k: 'com', n: 'Communication skills', ic: '💬', skills: ['Information sharing (exchanging thoughts, messages and information through interaction)', 'Presentation (using appropriate forms of writing, speaking and media for different purposes and audiences)', 'Written communication (reading, writing and using language to gather and communicate information)', 'Audience awareness (adapting the message to the audience)'] },
    { k: 'soc', n: 'Social skills', ic: '🤝', skills: ['Collaboration (working with others, giving and receiving feedback)', 'Conflict resolution (managing and resolving disagreements)', 'Working with others (seeking help, encouraging others, taking responsibility)'] },
    { k: 'self', n: 'Self-management skills', ic: '🗓️', skills: ['Organisation (managing time and tasks, planning and meeting deadlines)', 'Time management (using a schedule and breaking tasks into steps)', 'Emotional management (managing stress, frustration and motivation)', 'Reflection (considering what I learned and how I learn)'] },
    { k: 'res', n: 'Research skills', ic: '🔎', skills: ['Information literacy (finding, interpreting, judging and creating information)', 'Media literacy (interacting with media to use and create ideas and information)', 'Source evaluation (judging the reliability and bias of sources)', 'Ethical research (acknowledging sources, getting consent, avoiding plagiarism)'] },
    { k: 'thk', n: 'Thinking skills', ic: '🧠', skills: ['Critical thinking (analysing and evaluating issues and ideas)', 'Creative thinking (generating novel ideas and considering new perspectives)', 'Transfer (using skills and knowledge in new contexts)', 'Reflection (thinking about my thinking and my progress)'] }];

  D.FORMATS = [['physical', 'Physical product'], ['investigation', 'Scientific investigation'], ['app', 'Digital application'], ['website', 'Website'], ['resource', 'Educational resource'], ['art', 'Artistic creation'], ['community', 'Community initiative'], ['campaign', 'Campaign'], ['prototype', 'Model or prototype'], ['research', 'Research-based outcome'], ['performance', 'Performance or event'], ['other', 'Other']];

  D.CRIT_TYPES = ['Functionality', 'Accuracy', 'Quality', 'Durability', 'Creativity', 'Usability', 'Audience suitability', 'Scientific accuracy', 'Environmental impact', 'Effectiveness', 'Cost', 'Appearance', 'Other'];
  D.CRIT_EXAMPLES = [
    ['Functionality', 'The solar charger raises my phone battery by at least 20 % in 2 hours of direct sunlight.', 'Measure battery % before and after on three sunny days'],
    ['Audience suitability', 'At least 8 out of 10 Year 7 students rate the guide as “easy to understand” (4 or 5 out of 5).', 'Survey of 10 Year 7 students'],
    ['Durability', 'The bag holds 5 kg for 30 days of daily use without tearing.', 'Weekly check and a 5 kg load test'],
    ['Environmental impact', 'At least 80 % of the materials are recycled or reused.', 'Materials list with masses'],
    ['Quality', 'The book has 12 illustrated pages with no spelling errors, checked by two readers.', 'Proof-reading by my English teacher and a classmate']];

  D.SOURCE_TESTS = [['relevance', 'Relevance', 'Does it help answer my questions?'], ['authority', 'Authority', 'Who wrote it? Are they an expert or organisation I can trust?'], ['accuracy', 'Accuracy', 'Is it supported by evidence, and does it agree with other sources?'], ['purpose', 'Purpose', 'Why was it written: to inform, persuade, sell or entertain? Is it biased?'], ['currency', 'Currency', 'Is it recent enough for my topic?'], ['reliability', 'Reliability', 'Overall, how much can I rely on it?']];
  D.SOURCE_KINDS = ['Book', 'Journal article', 'Website', 'Video', 'Interview', 'Survey', 'Expert advice', 'Other'];

  D.JOURNAL_KINDS = [['reflection', '💭 Reflection'], ['research', '🔎 Research notes'], ['meeting', '👥 Supervisor meeting'], ['experiment', '🧪 Experiment or test'], ['design', '✏️ Design or drawing'], ['feedback', '🗣️ Feedback received'], ['challenge', '⚠️ Challenge'], ['decision', '🔀 Decision or change of direction'], ['progress', '📈 Progress update']];
  D.DEV_STAGES = [['design', '✏️ Initial designs and sketches'], ['draft', '📄 Drafts'], ['prototype', '🧩 Prototypes'], ['test', '🧪 Testing'], ['revised', '🔁 Revised versions'], ['final', '🏁 Final product']];
  D.PHASES = [['planning', 'Planning'], ['research', 'Research'], ['creating', 'Creating the product'], ['testing', 'Testing and improving'], ['reporting', 'Report and exhibition']];

  D.REPORT_HELP = {
    intro: 'Explain where the idea came from: the personal interest, experience or question that led to your project.',
    goal: 'State your learning goal clearly and explain how your personal interest led to it.',
    product: 'Describe the product or outcome you intended to create, who it is for and why.',
    context: 'Name the global context you chose and explain how it shaped your project.',
    criteria: 'Present your success criteria and explain why they are appropriate and measurable.',
    plan: 'Show how you planned the project: research, the timeline, and how you adapted the plan.',
    atl: 'Explain, with evidence, how you applied ATL skills to achieve your learning goal and to create your product.',
    process: 'Describe the main stages of developing the product, using evidence from your journal.',
    evaluation: 'Evaluate your product against each success criterion, with evidence.',
    reflection: 'Explain how the project has affected your knowledge, understanding or development as a learner.',
    evidence: 'List the evidence (journal extracts, photographs, test results) that supports the report.',
    references: 'List every source you used in a consistent referencing style.' };

  D.GOAL_Q = [['want', 'What do I want to learn?', 'For example: how to design and code a mobile app; how composting works and how to set one up.'], ['why', 'Why is this important to me?', 'Link it to your interests, experiences or plans for the future.'], ['know', 'What do I already know?', 'Be honest: this is your starting point.'], ['need', 'What do I need to learn?', 'List the knowledge and skills you do not yet have.'], ['skills', 'What new knowledge or skills do I want to develop?', 'Be specific: “use Scratch variables and loops”, not just “coding”.'], ['demonstrate', 'How will I show that I have achieved my learning goal?', 'For example: by explaining it, using it to make the product, teaching it to others, or passing a test.']];
})();
