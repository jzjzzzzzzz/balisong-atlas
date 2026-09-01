import type { Locale } from "@/components/Providers";

export const labels = {
  en: {
    essay: "Essay", evidence: "Argument & Evidence", methods: "Sources & Methods", draft: "Research Draft",
    author: "Author", verified: "Last verified", legalAsOf: "Legal sources as of", words: "words", read: "min read",
    chicago: "Chicago 18", disclosure: "AI-assisted research disclosure", contents: "Contents", notes: "Notes",
    bibliography: "Bibliography", primary: "Primary and Official Sources", scholarship: "Scholarship",
    institutional: "Institutional and Public-History Sources", englishText: "English full text", chineseSummary: "Chinese extended abstract",
    print: "Print / Save as PDF", currentNote: "Current note", documented: "Documented", corroborated: "Corroborated",
    contested: "Contested", interpretive: "Interpretive", insufficient: "Insufficient Evidence", source: "Supporting sources",
    counter: "Contradicting sources", related: "Related claims", methodology: "Methodology", inclusion: "Included",
    exclusion: "Excluded", limitations: "Limitations", sourceRegister: "Reviewed source register", status: "Verification status",
    category: "Source category", access: "Access", rights: "Rights", legalNotice: "Legal research notice",
    legalText: "This section analyzes legal classification historically and conceptually. It does not provide legal advice concerning possession, purchase, transport, or use.",
    aiTitle: "AI use disclosure", allEnglish: "The canonical journal article is in English; the interface and extended abstract are shown in Chinese when Chinese is selected.",
    openEnglish: "Open the complete English paper", close: "Close", figure: "Figure", synthetic: "AI-assisted interpretive visualization. Not a historical photograph or exact replica.",
    sourcesChecked: "candidate sources checked", citedSources: "sources cited", localCopies: "lawful local research copies", figures: "rights-reviewed figures",
  },
  zh: {
    essay: "论文", evidence: "论证与证据", methods: "来源与方法", draft: "研究草稿",
    author: "作者", verified: "最后核验", legalAsOf: "法律资料截至", words: "英文词", read: "分钟阅读",
    chicago: "Chicago 18", disclosure: "AI 辅助研究披露", contents: "目录", notes: "脚注",
    bibliography: "完整书目", primary: "一手与官方资料", scholarship: "学术研究",
    institutional: "机构与公共史资料", englishText: "英文正式全文", chineseSummary: "中文扩展摘要",
    print: "打印 / 通过浏览器另存 PDF", currentNote: "当前脚注", documented: "直接记录", corroborated: "交叉支持",
    contested: "存在争议", interpretive: "解释性判断", insufficient: "证据不足", source: "支持来源",
    counter: "冲突来源", related: "关联主张", methodology: "研究方法", inclusion: "纳入标准",
    exclusion: "排除标准", limitations: "研究限制", sourceRegister: "已审核来源清单", status: "核验状态",
    category: "来源类型", access: "访问状态", rights: "权利状态", legalNotice: "法律研究声明",
    legalText: "本节仅从历史与概念层面分析法律分类，不提供关于持有、购买、运输或使用的法律意见。",
    aiTitle: "AI 使用披露", allEnglish: "本页界面与扩展摘要为中文；符合期刊格式的正式论文原文为英文，可在下方展开阅读全文。",
    openEnglish: "展开完整英文论文", close: "关闭", figure: "图", synthetic: "AI 辅助解释性可视化；不是历史照片，也不是精确复制品。",
    sourcesChecked: "项候选来源已核查", citedSources: "项来源被引用", localCopies: "份合法本地研究副本", figures: "幅已审核权利图表",
  },
} satisfies Record<Locale, Record<string, string>>;

export const sectionTitlesZh: Record<string, string> = {
  "section-1": "一件物件，四种社会生命",
  "section-2": "方法：追踪物件穿越不同社会世界",
  "section-3": "从工坊到地方：工艺、亲属、生计与 Batangueño 身份",
  "section-4": "运动变得可见：转化过程的机械美学",
  "section-5": "当技能成为景观：表演、参与和社会身份",
  "section-6": "运动中的分类：法律如何把设计变成争议",
  "section-7": "蝴蝶刀作为边界物",
  "section-8": "反论点与研究限制",
  "section-9": "结论：物件运动时，什么也在移动？",
  "ai-disclosure": "AI 使用披露",
};

export const sectionSummariesZh: Record<string, string> = {
  "section-1": "提出核心悖论：同一物件在经济、文化机构、视觉媒介与法律中被选择不同属性。工作论点把“运动造成意义”修正为“可见转化是一种由社会实践激活的条件”。",
  "section-2": "说明物质文化、物件传记、边界物、视觉分析与法律文本比较方法，并严格区分直接记录、视觉观察、机构表述、历史争议和作者解释。",
  "section-3": "以 1947 年用词与 1951 年 Batangas 产业记录为时间锚点，分析后来的国家展示、文化百科、地方政府与大学如何共同建构工艺遗产叙述，同时保留起源与代际传承的不确定性。",
  "section-4": "把转化理解为外部可见的动态形式，借助 interaction aesthetics 与 cultural affordance 解释审美可读性，同时拒绝技术决定论和任何机械复刻。",
  "section-5": "分析可观看的技能如何在媒体中成为评价、声誉与身份表达，但明确指出尚无足够民族志证明地方工艺与网络表演之间的连续谱系。",
  "section-6": "比较正式法条、行政公告、司法判决与异议意见，说明法律如何把运动机制变成分类证据；不同法条与程序会产生不同结论。",
  "section-7": "综合四个社会世界：物件保持可识别性，不同机构却强调地方、动态形式、可观察能力或法定机制。边界物概念在此被限定使用。",
  "section-8": "处理五项反论点：结构不是社会原因、网络表演可能是断裂、法律争议不能被审美化、遗产可能包含当代品牌建构，以及资料的语言和地域偏差。",
  "section-9": "结论把可见转化界定为 enabling affordance：它让分类可以移动，但真正的意义与后果来自工匠、机构、媒体、平台和法律制度。",
};
