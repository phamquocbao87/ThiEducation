export const LANDING_ASSETS = {
  wondersBooksHero: '/resources/web/wonders-books-hero.webp',
  learningBanner: '/resources/web/web-landing.webp',
  iconLaptopCap: '/resources/web/icon_core_ela.webp',
  iconLightbulb: '/resources/web/icon_core_inquiry.webp',
  iconBrainCloud: '/resources/web/icon_core_structured.webp',
  cardGkPhonics: '/resources/web/card_gk_phonics.webp',
  cardGkSightwords: '/resources/web/card_gk_sightwords.webp',
  cardGkBigidea: '/resources/web/card_gk_bigidea.webp',
  cardGkSel: '/resources/web/card_gk_sel.webp',
  cardPriClosereading: '/resources/web/card_pri_closereading.webp',
  cardPriTextevidence: '/resources/web/card_pri_textevidence.webp',
  cardPriNonfiction: '/resources/web/card_pri_nonfiction.webp',
  cardWritingProcess: '/resources/web/card_writing_process.webp',
  cardGraphicOrganizers: '/resources/web/card_graphic_organizers.webp',
};

export const LANDING_CONTENT = {
  vi: {
    nav: {
      philosophy: 'Triết Lý Giáo Dục ELA',
      kindergarten: 'Mầm Non (Wonders GK)',
      primary: 'Tiểu Học (Grades 1–5)',
      writingAndThinking: 'Viết Học Thuật & Tư Duy',
      curriculumInside: 'Bộ Sách Wonders',
      loginBtn: 'Đăng Nhập',
      tryFreeBtn: 'Đăng Ký Kiểm Tra Năng Lực',
    },
    hero: {
      badge: 'CHƯƠNG TRÌNH ANH NGỮ HỌC THUẬT CHUẨN BẢN XỨ MỸ (McGRAW-HILL WONDERS)',
      slogan: 'LEARNING BEYOND BOUNDARIES',
      title: 'Không Chỉ Là Học Tiếng Anh (ESL) — Chúng Tôi Xây Dựng Năng Lực Ngôn Ngữ Bản Ngữ (ELA)',
      subtitle:
        'Đối với lứa tuổi Mầm non (Kindergarten / Wonders GK) và Tiểu học (Grades 1–5), giáo trình McGraw-Hill Wonders tại LAK EDUCATION là chương trình phát triển năng lực ngôn ngữ bản ngữ (ELA - English Language Arts): chuẩn hóa tư duy phản biện, xây dựng thói quen đọc hiểu học thuật và tích hợp kiến thức Khoa học - Đời sống ngay từ những năm đầu đời.',
      ctaPrimary: 'Đăng Nhập Vào Hệ Thống Đào Tạo',
      ctaSecondary: 'Khám Phá Lộ Trình Wonders GK – G5',
      stats: [
        { value: 'GK – G5', label: 'Lộ trình chuẩn Phổ thông Mỹ (5–11 tuổi)' },
        { value: '50%+', label: 'Văn bản Khoa học (Science) & Xã hội (Social Studies)' },
        { value: '100%', label: 'Giáo viên Bản xứ & Chuyên gia ELA chuẩn quốc tế' },
        { value: '9 Trụ Cột', label: 'Phát triển toàn diện Đọc sâu, Viết học thuật & Tư duy' },
      ],
    },
    threeCoreValues: [
      {
        icon: LANDING_ASSETS.iconLaptopCap,
        title: 'Chuẩn Ngôn Ngữ Bản Ngữ Mỹ (ELA - English Language Arts)',
        desc: 'Vượt qua ranh giới học tiếng Anh giao tiếp thông thường (ESL), học viên suy nghĩ, đọc hiểu và viết học thuật trực tiếp bằng tiếng Anh như học sinh bản xứ Mỹ.',
        tag: 'Native ELA Standard',
      },
      {
        icon: LANDING_ASSETS.iconLightbulb,
        title: 'Khơi Dậy Tư Duy Tò Mò & Lập Luận Có Dẫn Chứng',
        desc: 'Thông qua hệ thống câu hỏi lớn (Big Idea & Weekly Question) và kỹ thuật tìm dẫn chứng (Text Evidence), trẻ hình thành thói quen "nói có sách, mách có chứng".',
        tag: 'Critical Inquiry',
      },
      {
        icon: LANDING_ASSETS.iconBrainCloud,
        title: 'Hệ Thống Hóa Thông Tin & Viết Học Thuật Bài Bản',
        desc: 'Ứng dụng sơ đồ tư duy trực quan (Graphic Organizers) và quy trình viết 4 bước chuẩn quốc tế giúp trẻ tổ chức ý tưởng logic, mạch lạc từ sớm.',
        tag: 'Structured Thinking',
      },
    ],
    kindergartenSection: {
      badge: 'GIAI ĐOẠN 1: LỨA TUỔI MẦM NON (KINDERGARTEN / WONDERS GK)',
      title: 'Xây Dựng Nền Tảng Âm Vị, Tự Đọc Độc Lập & Trí Tuệ Cảm Xúc (SEL)',
      subtitle:
        'Giúp trẻ đọc thông, phát âm chuẩn xác mà không cần dịch sang tiếng mẹ đẻ, đồng thời nuôi dưỡng sự tò mò và nhân cách xã hội ngay từ những bước đầu đời.',
      pillars: [
        {
          number: '01',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkPhonics,
          title: 'Phương Pháp Phonics & Phonemic Awareness Chuẩn Xác',
          highlights: [
            'Thay vì học vẹt bảng chữ cái, trẻ được luyện nhận diện âm vị (Phonemic Awareness) qua bài hát, vần điệu (rhymes) và hình ảnh trực quan.',
            'Trẻ làm chủ kỹ thuật ghép âm (Blending) và tách âm (Segmenting) — tạo nền tảng tự đọc từ mới độc lập mà không cần dịch sang tiếng mẹ đẻ.',
          ],
          badge: 'Blending & Segmenting',
        },
        {
          number: '02',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkSightwords,
          title: 'Xây Dựng Vốn Từ Vựng Thị Giác (Sight Words / High-Frequency Words)',
          highlights: [
            'Wonders cài cắm các từ có tần suất xuất hiện cao (the, see, like, we, go...) lặp đi lặp lại có chủ đích qua các câu chuyện ngắn sinh động.',
            'Giúp trẻ nhận diện tức thì và sớm đọc được câu hoàn chỉnh ngay từ lứa tuổi mầm non.',
          ],
          badge: 'Early Sentence Reading',
        },
        {
          number: '03',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkBigidea,
          title: 'Hình Thành Tư Duy Tò Mò Qua "Big Idea" & "Weekly Question"',
          highlights: [
            'Các chủ đề gần gũi với lứa tuổi được đặt dưới dạng câu hỏi mở: "What do people do all day?" (Mọi người làm việc gì?), "How do animals move?" (Động vật di chuyển thế nào?).',
            'Trẻ học cách quan sát thế giới xung quanh và tập diễn đạt suy nghĩ cá nhân bằng tiếng Anh.',
          ],
          badge: 'Big Idea & Weekly Question',
        },
        {
          number: '04',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkSel,
          title: 'Phát Triển Nhận Thức Cảm Xúc – Xã Hội (SEL)',
          highlights: [
            'Những câu chuyện nhân văn, nhẹ nhàng giúp trẻ nhận biết cảm xúc bản thân (Social-Emotional Learning).',
            'Trẻ học cách chia sẻ đồ chơi, tôn trọng bạn bè và tuân thủ các quy tắc ứng xử văn minh trong lớp học.',
          ],
          badge: 'Social-Emotional Learning',
        },
      ],
    },
    primarySection: {
      badge: 'GIAI ĐOẠN 2: LỨA TUỔI TIỂU HỌC (GRADES 1–5)',
      title: 'Rèn Kỹ Thuật Đọc Sâu (Close Reading), Tư Duy Dẫn Chứng & Tích Hợp Khoa Học',
      subtitle:
        'Chuyển từ "Học để Đọc" (Learn to Read) sang "Đọc để Học" (Read to Learn) với hơn 50% văn bản học thuật về Khoa học Tự nhiên và Xã hội học.',
      pillars: [
        {
          icon: '🌺',
          image: LANDING_ASSETS.cardPriClosereading,
          title: 'Rèn Kỹ Thuật Đọc Sâu (Close Reading) & Khai Thác Thông Tin',
          subtitle: 'Trẻ học cách không đọc lướt mà phân tích sâu cấu trúc văn bản:',
          bullets: [
            'Main Idea & Key Details: Nhận diện chính xác đâu là ý chính, đâu là chi tiết bổ trợ.',
            'Cause & Effect / Problem & Solution: Phân tích nguyên nhân – kết quả và giải pháp của vấn đề trong bài.',
            'Text Features: Khai thác biểu đồ, bản đồ, chú thích ảnh (captions), mục lục — kỹ năng sống quan trọng để xử lý tài liệu thực tế.',
          ],
          color: '#1890ff',
        },
        {
          icon: '🌺',
          image: LANDING_ASSETS.cardPriTextevidence,
          title: 'Kỹ Năng Lập Luận Dựa Trên Dẫn Chứng (Text Evidence)',
          subtitle: '"Find evidence in the text to support your answer"',
          bullets: [
            'Khác với bài tập trắc nghiệm thông thường, Wonders luôn yêu cầu học sinh tìm dẫn chứng trực tiếp trong văn bản để chứng minh câu trả lời.',
            'Rèn cho học sinh tiểu học thói quen: "Nói có sách, mách có chứng", loại bỏ lối suy diễn cảm tính và hình thành tư duy phản biện từ sớm.',
          ],
          color: '#722ed1',
        },
        {
          icon: '🌺',
          image: LANDING_ASSETS.cardPriNonfiction,
          title: 'Cân Bằng Giữa Văn Học (Fiction) & Kiến Thức Thực Tế (Non-Fiction)',
          subtitle: 'Hơn 50% văn bản trong Wonders là Informational Texts:',
          bullets: [
            'Khoa học tự nhiên (Science): Chu kỳ nước, sinh quyển, hệ mặt trời & vũ trụ.',
            'Xã hội học (Social Studies): Lịch sử di cư, các nhà sáng chế vĩ đại, quyền và trách nhiệm công dân.',
            'Trẻ vừa phát triển ngôn ngữ, vừa tích lũy kiến thức nền tảng tương đương học sinh bản xứ Mỹ.',
          ],
          color: '#13c2c2',
        },
      ],
    },
    writingAndOrganizerSection: {
      badge: 'NĂNG LỰC HỌC THUẬT BẬC CAO (ACADEMIC WRITING & GRAPHIC ORGANIZERS)',
      title: 'Quy Trình Viết Học Thuật 4 Bước & Tư Duy Tổ Chức Thông Tin Logic',
      writingImage: LANDING_ASSETS.cardWritingProcess,
      organizerImage: LANDING_ASSETS.cardGraphicOrganizers,
      writingSteps: [
        {
          step: 'BƯỚC 01',
          name: 'Brainstorm & Outline',
          viTitle: 'Lập Dàn Ý & Ý Tưởng',
          desc: 'Khơi gợi ý tưởng cốt lõi, xác định luận điểm chính và lập sườn bài mạch lạc trước khi viết.',
          icon: '💡',
          accent: '#faad14',
          lightBg: 'linear-gradient(145deg, #fffdf5 0%, #fff7d6 100%)',
        },
        {
          step: 'BƯỚC 02',
          name: 'Drafting',
          viTitle: 'Viết Bản Nháp (Draft)',
          desc: 'Triển khai các câu văn và đoạn văn hoàn chỉnh theo đúng cấu trúc dàn ý đã vạch ra.',
          icon: '✍️',
          accent: '#1890ff',
          lightBg: 'linear-gradient(145deg, #f5faff 0%, #e6f4ff 100%)',
        },
        {
          step: 'BƯỚC 03',
          name: 'Revising & Editing',
          viTitle: 'Chỉnh Sửa & Biên Tập',
          desc: 'Rà soát tính chặt chẽ của lập luận, nâng cấp vốn từ vựng học thuật và chuẩn hóa ngữ pháp.',
          icon: '🔍',
          accent: '#722ed1',
          lightBg: 'linear-gradient(145deg, #fbf7ff 0%, #f3e8ff 100%)',
        },
        {
          step: 'BƯỚC 04',
          name: 'Publishing',
          viTitle: 'Hoàn Thiện & Công Bố',
          desc: 'Hoàn chỉnh tác phẩm cuối cùng và tự tin thuyết trình, chia sẻ bài viết trước lớp.',
          icon: '🏆',
          accent: '#52c41a',
          lightBg: 'linear-gradient(145deg, #f6ffed 0%, #e4f9d1 100%)',
        },
      ],
      writingGenres: [
        {
          name: 'Opinion Writing',
          viName: 'Viết Bày Tỏ Quan Điểm',
          desc: 'Viết đoạn văn/bài luận nêu rõ quan điểm cá nhân và đưa ra các lý do, dẫn chứng thuyết phục người đọc.',
        },
        {
          name: 'Informative / Explanatory',
          viName: 'Viết Giải Thích & Cung Cấp Thông Tin',
          desc: 'Viết bài cung cấp kiến thức khoa học, xã hội hoặc giải thích rõ ràng một quy trình thực tế.',
        },
        {
          name: 'Narrative Writing',
          viName: 'Viết Tự Sự & Sáng Tạo Câu Chuyện',
          desc: 'Kể lại một trải nghiệm cá nhân hoặc sáng tác câu chuyện có cốt truyện, nhân vật và thông điệp rõ ràng.',
        },
      ],
      graphicOrganizers: {
        title: '🌺 Phát Triển Tư Duy Tổ Chức Thông Tin Qua Graphic Organizers',
        desc: 'Mỗi bài học đều tích hợp các công cụ sơ đồ tư duy trực quan giúp trẻ hình thành thói quen hệ thống hóa lượng thông tin lớn một cách logic, mạch lạc:',
        tools: [
          { name: 'Venn Diagram (Biểu đồ Venn)', purpose: 'So sánh điểm giống nhau và khác nhau giữa 2 đối tượng/khái niệm.' },
          { name: 'Sequence Chart (Chuỗi sự kiện)', purpose: 'Sắp xếp trình tự diễn biến sự kiện hoặc quy trình khoa học.' },
          { name: 'Concept Web (Mạng ý tưởng)', purpose: 'Kết nối ý chính (Main Idea) với mạng lưới các chi tiết bổ trợ.' },
        ],
      },
    },
    bookShowcaseSection: {
      badge: 'HỆ SINH THÁI GIÁO TRÌNH McGRAW-HILL WONDERS CHÍNH HÃNG',
      title: 'Trọn Bộ Học Liệu Chuẩn Mỹ Đồng Hành Cùng Học Viên Tại LAK EDUCATION',
      subtitle:
        'Mỗi học viên được tiếp cận hệ thống tài liệu đồng bộ từ Đọc – Viết – Ngữ âm đến Đánh giá định kỳ chuẩn McGraw-Hill Education:',
      books: [
        { name: 'Reading/Writing Companion', desc: 'Sách rèn kỹ năng Đọc sâu (Close Reading), phân tích Text Evidence và thực hành Viết học thuật theo từng Unit.' },
        { name: 'Genre Read-Aloud Anthology', desc: 'Tuyển tập tác phẩm Văn học (Fiction) và Khoa học - Đời sống (Non-fiction) đa thể loại.' },
        { name: 'Practice Book & Phonics / Handwriting', desc: 'Rèn nền tảng Phonemic Awareness, Phonics, Sight Words, Ngữ pháp và Luyện viết chữ chuẩn.' },
        { name: 'Decodable Readers & Benchmark Assessments', desc: 'Truyện luyện đọc độc lập theo âm vị và Bộ đề đánh giá năng lực chuẩn hóa theo từng giai đoạn.' },
      ],
    },
  },
  en: {
    nav: {
      philosophy: 'ELA Philosophy',
      kindergarten: 'Kindergarten (Wonders GK)',
      primary: 'Primary (Grades 1–5)',
      writingAndThinking: 'Academic Writing & Thinking',
      curriculumInside: 'Wonders Books',
      loginBtn: 'Login',
      tryFreeBtn: 'Book Free Assessment',
    },
    hero: {
      badge: 'U.S. NATIVE ENGLISH LANGUAGE ARTS CURRICULUM (McGRAW-HILL WONDERS)',
      slogan: 'LEARNING BEYOND BOUNDARIES',
      title: 'Beyond ESL — Empowering Students with True Native English Language Arts (ELA)',
      subtitle:
        'For Kindergarten (Wonders GK) and Primary learners (Grades 1–5), McGraw-Hill Wonders at LAK EDUCATION is not merely an ESL textbook — it is a comprehensive Native English Language Arts (ELA) program that standardizes critical thinking, builds deep academic reading habits, and integrates real-world Science & Social Studies from early childhood.',
      ctaPrimary: 'Login to Learning & ERP Portal',
      ctaSecondary: 'Explore Wonders GK – G5 Roadmap',
      stats: [
        { value: 'GK – G5', label: 'U.S. Common Core Aligned (Ages 5–11)' },
        { value: '50%+', label: 'Informational Texts in Science & Social Studies' },
        { value: '100%', label: 'Qualified Native Teachers & ELA Specialists' },
        { value: '9 Pillars', label: 'Close Reading, Text Evidence & Academic Writing' },
      ],
    },
    threeCoreValues: [
      {
        icon: LANDING_ASSETS.iconLaptopCap,
        title: 'True Native ELA Standard (Not Just ESL)',
        desc: 'Students learn to think, analyze, read, and write directly in English with the same academic rigor as native students in American schools.',
        tag: 'Native ELA Standard',
      },
      {
        icon: LANDING_ASSETS.iconLightbulb,
        title: 'Curiosity via Big Ideas & Text Evidence',
        desc: 'Guided by open-ended "Big Ideas & Weekly Questions" and strict Text Evidence tasks, children build early critical thinking and evidence-based reasoning.',
        tag: 'Critical Inquiry',
      },
      {
        icon: LANDING_ASSETS.iconBrainCloud,
        title: 'Graphic Organizers & Structured Academic Writing',
        desc: 'Using Venn diagrams, Sequence charts, Concept webs, and a 4-step Writing Process to organize complex knowledge logically.',
        tag: 'Structured Thinking',
      },
    ],
    kindergartenSection: {
      badge: 'STAGE 1: KINDERGARTEN (WONDERS GK)',
      title: 'Phonemic Awareness, Independent Decoding & Social-Emotional Growth (SEL)',
      subtitle:
        'Building a rock-solid foundation so young learners decode new words independently without translating into their mother tongue.',
      pillars: [
        {
          number: '01',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkPhonics,
          title: 'Systematic Phonics & Phonemic Awareness',
          highlights: [
            'Instead of rote alphabet memorization, children master phonemic awareness through songs, rhymes, and vivid visual cues.',
            'Students practice sound blending and segmenting — empowering them to decode and read unfamiliar words independently.',
          ],
          badge: 'Blending & Segmenting',
        },
        {
          number: '02',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkSightwords,
          title: 'Visual Vocabulary & High-Frequency Sight Words',
          highlights: [
            'Wonders purposefully embeds high-frequency Sight Words (the, see, like, we, go...) across engaging short stories.',
            'Enables Kindergarteners to read complete sentences fluently from an early stage.',
          ],
          badge: 'Early Sentence Reading',
        },
        {
          number: '03',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkBigidea,
          title: 'Sparking Curiosity via "Big Idea" & "Weekly Question"',
          highlights: [
            'Age-appropriate themes framed as open inquiry: "What do people do all day?", "How do animals move?".',
            'Encourages children to observe the real world and express their own ideas confidently.',
          ],
          badge: 'Big Idea & Weekly Question',
        },
        {
          number: '04',
          icon: '🌺',
          image: LANDING_ASSETS.cardGkSel,
          title: 'Social-Emotional Learning (SEL)',
          highlights: [
            'Heartwarming stories help children recognize emotions, practice empathy, share with peers, and respect classroom norms.',
            'Nurtures well-rounded character alongside language acquisition.',
          ],
          badge: 'Social-Emotional Learning',
        },
      ],
    },
    primarySection: {
      badge: 'STAGE 2: PRIMARY GRADES (GRADES 1–5)',
      title: 'Close Reading, Text Evidence & Cross-Curricular Science/Social Studies',
      subtitle:
        'Transitioning from "Learning to Read" to "Reading to Learn" with over 50% non-fiction informational texts.',
      pillars: [
        {
          icon: '🌺',
          image: LANDING_ASSETS.cardPriClosereading,
          title: 'Close Reading & Deep Information Extraction',
          subtitle: 'Students go beyond skimming with explicit analytical techniques:',
          bullets: [
            'Main Idea & Key Details: Distinguishing core themes from supporting details.',
            'Cause & Effect / Problem & Solution: Analyzing root causes, consequences, and real-world solutions.',
            'Text Features: Reading charts, maps, photo captions, and tables of contents — vital life skills for academic research.',
          ],
          color: '#1890ff',
        },
        {
          icon: '🌺',
          image: LANDING_ASSETS.cardPriTextevidence,
          title: 'Evidence-Based Argumentation (Text Evidence)',
          subtitle: '"Find evidence in the text to support your answer"',
          bullets: [
            'Unlike standard multiple-choice drills, Wonders requires students to cite concrete proof directly from the passage.',
            'Eliminates guesswork and cultivates rigorous critical thinking from primary school.',
          ],
          color: '#722ed1',
        },
        {
          icon: '🌺',
          image: LANDING_ASSETS.cardPriNonfiction,
          title: 'Balanced Fiction & Real-World Non-Fiction (50%+)',
          subtitle: 'Over 50% of Wonders texts are Informational Texts:',
          bullets: [
            'Natural Sciences: The water cycle, ecosystems, biosphere, and outer space.',
            'Social Studies: Migration history, great inventors, and civic responsibility.',
            'Students acquire subject-matter knowledge equivalent to American elementary Science and Social Studies.',
          ],
          color: '#13c2c2',
        },
      ],
    },
    writingAndOrganizerSection: {
      badge: 'HIGHER-ORDER ACADEMIC SKILLS (WRITING PROCESS & GRAPHIC ORGANIZERS)',
      title: '4-Step Academic Writing Process & Visual Information Organization',
      writingImage: LANDING_ASSETS.cardWritingProcess,
      organizerImage: LANDING_ASSETS.cardGraphicOrganizers,
      writingSteps: [
        {
          step: 'STEP 01',
          name: 'Brainstorm & Outline',
          viTitle: 'Idea Generation & Structuring',
          desc: 'Spark core ideas, define main arguments, and map out a clear structural outline.',
          icon: '💡',
          accent: '#faad14',
          lightBg: 'linear-gradient(145deg, #fffdf5 0%, #fff7d6 100%)',
        },
        {
          step: 'STEP 02',
          name: 'Drafting',
          viTitle: 'Composing the First Draft',
          desc: 'Transform outlined thoughts into structured sentences and cohesive academic paragraphs.',
          icon: '✍️',
          accent: '#1890ff',
          lightBg: 'linear-gradient(145deg, #f5faff 0%, #e6f4ff 100%)',
        },
        {
          step: 'STEP 03',
          name: 'Revising & Editing',
          viTitle: 'Refining Logic & Grammar',
          desc: 'Review argument clarity, elevate academic vocabulary, and polish grammar & mechanics.',
          icon: '🔍',
          accent: '#722ed1',
          lightBg: 'linear-gradient(145deg, #fbf7ff 0%, #f3e8ff 100%)',
        },
        {
          step: 'STEP 04',
          name: 'Publishing',
          viTitle: 'Final Masterpiece & Presentation',
          desc: 'Finalize the polished composition and present the work with pride and confidence.',
          icon: '🏆',
          accent: '#52c41a',
          lightBg: 'linear-gradient(145deg, #f6ffed 0%, #e4f9d1 100%)',
        },
      ],
      writingGenres: [
        {
          name: 'Opinion Writing',
          viName: 'Persuasive & Opinion Essays',
          desc: 'State clear personal viewpoints supported by logical reasons and textual evidence.',
        },
        {
          name: 'Informative / Explanatory',
          viName: 'Expository & Process Writing',
          desc: 'Deliver factual knowledge or explain scientific/real-world processes clearly.',
        },
        {
          name: 'Narrative Writing',
          viName: 'Personal & Creative Narratives',
          desc: 'Recount personal experiences or craft original stories with structured plots.',
        },
      ],
      graphicOrganizers: {
        title: '🌺 Logical Information Structuring via Graphic Organizers',
        desc: 'Every lesson integrates visual thinking maps so students systematically organize large volumes of information:',
        tools: [
          { name: 'Venn Diagram', purpose: 'Compare similarities and differences between concepts.' },
          { name: 'Sequence Chart', purpose: 'Map chronological events or scientific processes.' },
          { name: 'Concept Web', purpose: 'Connect central ideas with supporting details.' },
        ],
      },
    },
    bookShowcaseSection: {
      badge: 'OFFICIAL McGRAW-HILL WONDERS CURRICULUM SUITE',
      title: 'Complete American ELA Learning Ecosystem at LAK EDUCATION',
      subtitle:
        'Every learner works with the complete, authentic McGraw-Hill Wonders book suite covering Reading, Writing, Phonics, and Standardized Assessments:',
      books: [
        { name: 'Reading/Writing Companion', desc: 'Interactive close-reading texts, Text Evidence prompts, and unit-by-unit academic writing workshops.' },
        { name: 'Genre Read-Aloud Anthology', desc: 'Richly illustrated Literature (Fiction) and Science/Social Studies (Informational Texts).' },
        { name: 'Practice Book & Phonics / Handwriting', desc: 'Phonological awareness, phonics blending, Sight Words, grammar, and structured handwriting.' },
        { name: 'Decodable Readers & Benchmark Assessments', desc: 'Grade-leveled independent readers and standardized Unit/Benchmark progress assessments.' },
      ],
    },
  },
};
