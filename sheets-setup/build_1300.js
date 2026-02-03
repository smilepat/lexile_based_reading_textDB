const fs = require('fs');

const passages = [
  {
    text_id: "L1300-NAR-100-001", lexile_score: 1340, genre: "Narrative",
    topic: "The Ethics of Observation", length_type: "Short",
    grade_hint: "\uB300\uD5591", vocabulary_band: "B2/C1", intended_use: "\uC218\uC5C5",
    text_body: "Dr. Harmon positioned herself behind the observation glass, acutely aware that her presence, however concealed, constituted an intervention in the very phenomenon she sought to document objectively. The participants, ostensibly unaware of being monitored, exhibited behavioral patterns that she recognized as fundamentally shaped by the institutional setting itself. She annotated her field notes with increasing ambivalence, questioning whether the epistemological assumptions underpinning her methodology could withstand scrutiny. The boundary between observer and observed, she conceded reluctantly, had been rendered untenable by her own theoretical commitments to reflexivity."
  },
  {
    text_id: "L1300-NAR-200-001", lexile_score: 1380, genre: "Narrative",
    topic: "The Researcher's Dilemma", length_type: "Medium",
    grade_hint: "\uB300\uD5591", vocabulary_band: "C1", intended_use: "\uC218\uC5C5",
    text_body: "Professor Adeyemi stared at the longitudinal dataset spread across her monitor, confronting an anomaly that threatened to undermine three years of carefully constructed argumentation. The correlation she had hypothesized between socioeconomic stratification and educational attainment appeared, upon rigorous reanalysis, to be substantially mediated by variables her original model had neither anticipated nor controlled for adequately. Her initial inclination was to rationalize the discrepancy as a methodological artifact, attributable perhaps to sampling bias or measurement error, yet intellectual honesty compelled her to acknowledge that such explanations were insufficiently supported by the evidence. She recalled the admonition of her doctoral advisor, who had frequently cautioned that the most consequential discoveries in social science often emerged not from the confirmation of prevailing hypotheses but from the willingness to interrogate one's own foundational assumptions. The implications were professionally uncomfortable: revision would necessitate a fundamental reconceptualization of her theoretical framework, potentially alienating collaborators who had invested considerable intellectual capital in the existing paradigm. Nevertheless, she recognized that the integrity of scholarly inquiry demanded subordination of personal convenience to empirical rigor. She began drafting the revised analysis, acknowledging openly the limitations of her earlier work and proposing a more nuanced multivariate approach that accommodated the complexity her data revealed."
  },
  {
    text_id: "L1300-EXP-050-001", lexile_score: 1420, genre: "Expository",
    topic: "Epistemology", length_type: "Micro",
    grade_hint: "\uB300\uD5591", vocabulary_band: "C1", intended_use: "\uC6CC\uBC0D\uC5C5",
    text_body: "Epistemology, the philosophical investigation of knowledge itself, interrogates the conditions under which belief may be considered justified. Contemporary epistemologists have increasingly problematized the assumption that knowledge constitutes merely justified true belief, proposing instead that additional conditions are requisite for addressing Gettier-type counterexamples."
  },
  {
    text_id: "L1300-EXP-100-001", lexile_score: 1360, genre: "Expository",
    topic: "Sociolinguistics", length_type: "Short",
    grade_hint: "\uB300\uD5591", vocabulary_band: "B2/C1", intended_use: "\uC218\uC5C5",
    text_body: "Sociolinguistic research has demonstrated that language variation is not merely an incidental feature of communication but rather a systematically structured phenomenon reflecting underlying social hierarchies. Code-switching, for instance, is frequently employed as a discursive strategy through which speakers negotiate identity and assert membership within particular communities of practice. The efficacy of such linguistic maneuvering is contingent upon the interlocutors' shared recognition of socially embedded norms governing register appropriateness. Consequently, what superficially appears as random alternation between linguistic codes reveals, upon closer analysis, sophisticated pragmatic competence."
  },
  {
    text_id: "L1300-EXP-200-001", lexile_score: 1440, genre: "Expository",
    topic: "Behavioral Neuroscience", length_type: "Medium",
    grade_hint: "\uB300\uD5592", vocabulary_band: "C1", intended_use: "\uC218\uC5C5",
    text_body: "Behavioral neuroscience seeks to elucidate the neurobiological substrates of cognition and affect by examining the relationship between neural architecture and observable behavior. Recent advances in functional neuroimaging have facilitated increasingly precise mapping of cortical activation patterns associated with complex cognitive tasks, though interpretation of such data remains methodologically contentious. The assumption that localized neural activity corresponds directly to discrete psychological functions has been critiqued as an oversimplification that fails to account for the distributed and dynamic nature of neural processing. Moreover, the ecological validity of laboratory-based paradigms has been questioned, as the artificial constraints imposed by neuroimaging environments may elicit cognitive strategies fundamentally different from those deployed in naturalistic contexts. Researchers have consequently advocated for multimodal approaches that integrate neuroimaging data with behavioral observation, self-report measures, and computational modeling. Such methodological triangulation is considered essential for constructing accounts of brain-behavior relationships that are both empirically robust and theoretically coherent. The field's trajectory suggests that reductionist explanations, while valuable at specific levels of analysis, must be complemented by systems-level perspectives capable of capturing the emergent properties that characterize human cognition in its full complexity."
  },
  {
    text_id: "L1300-EXP-350-001", lexile_score: 1480, genre: "Expository",
    topic: "The Philosophy of Consciousness", length_type: "Long",
    grade_hint: "\uB300\uD5592", vocabulary_band: "C1", intended_use: "\uB2E4\uB3C5",
    text_body: "The philosophy of consciousness addresses what has been characterized as the most intractable problem in contemporary intellectual discourse: the nature of subjective experience and its relationship to physical processes. The so-called hard problem, articulated most influentially by David Chalmers, concerns why and how neurophysiological activity gives rise to phenomenal awareness, a question that resists resolution through the methodologies conventionally employed in the empirical sciences. Materialist positions, which maintain that consciousness is reducible to or supervenes upon physical states, confront the persistent difficulty of explaining qualitative experience, or qualia, in terms that do not ultimately presuppose the very phenomenon requiring explanation. Functionalist accounts, which identify mental states with their causal roles rather than their intrinsic properties, offer a framework that accommodates multiple realizability but have been criticized for neglecting the irreducibly subjective character of conscious experience. Property dualism, by contrast, posits that consciousness constitutes a fundamental feature of reality not derivable from physical properties alone, thereby preserving the ontological distinctiveness of subjective experience while avoiding the interaction problems associated with classical substance dualism. However, critics have argued that property dualism introduces explanatory gaps of its own, particularly regarding the mechanism by which non-physical properties causally interact with physical systems. Integrated Information Theory, proposed by Giulio Tononi, represents a more recent attempt to formalize the relationship between consciousness and information processing, suggesting that consciousness corresponds to integrated information measured by the quantity phi. While this framework has generated considerable interdisciplinary interest, its empirical testability remains contested, and fundamental questions persist regarding whether mathematical formalization can adequately capture the qualitative dimensions of experience. The ongoing difficulty of adjudicating among these competing frameworks suggests that the problem of consciousness may require not merely refinement of existing theoretical approaches but a fundamental reconceptualization of the categories through which the relationship between mind and matter is understood. Whether such reconceptualization will emerge from neuroscience, philosophy, or some as-yet-unanticipated interdisciplinary synthesis remains an open and profoundly consequential question."
  },
  {
    text_id: "L1300-INF-100-001", lexile_score: 1350, genre: "Informational",
    topic: "Peer-Reviewed Research", length_type: "Short",
    grade_hint: "\uB300\uD5591", vocabulary_band: "B2/C1", intended_use: "\uC218\uC5C5",
    text_body: "The peer review process constitutes a foundational mechanism of quality assurance within academic publishing, whereby submitted manuscripts are subjected to critical evaluation by disciplinary experts prior to publication. This gatekeeping function is intended to ensure that published research meets established standards of methodological rigor, theoretical coherence, and evidentiary support. Nevertheless, the process has been critiqued on multiple grounds, including its susceptibility to reviewer bias, its tendency to privilege established paradigms over genuinely innovative approaches, and the considerable delays it introduces into the dissemination of research findings."
  },
  {
    text_id: "L1300-INF-200-001", lexile_score: 1400, genre: "Informational",
    topic: "Economic Inequality Analysis", length_type: "Medium",
    grade_hint: "\uB300\uD5592", vocabulary_band: "C1", intended_use: "\uC218\uC5C5",
    text_body: "Contemporary analyses of economic inequality have increasingly recognized that disparities in wealth and income distribution cannot be adequately understood through purely economic metrics but must be situated within broader socioeconomic and institutional contexts. The Gini coefficient, while widely utilized as a summary measure of distributional inequality, has been criticized for obscuring important structural dimensions, including the distinction between inequality arising from differential returns to capital and that attributable to labor market segmentation. Thomas Piketty's influential analysis demonstrated that when the rate of return on capital consistently exceeds the rate of economic growth, wealth concentration tends to increase inexorably, a dynamic that operates largely independent of individual merit or productivity. This finding has significant implications for policy frameworks predicated on the assumption that market mechanisms, left unregulated, will generate broadly equitable outcomes. Furthermore, intersectional approaches have illuminated how economic inequality is compounded by and intersects with disparities along dimensions of race, gender, and geographic location, producing cumulative disadvantages that are inadequately captured by aggregate statistical measures. The recognition that inequality is a multidimensional phenomenon has prompted calls for more sophisticated analytical frameworks capable of integrating economic data with sociological and political analysis, thereby facilitating policy interventions that address root causes rather than merely ameliorating symptoms."
  },
  {
    text_id: "L1300-ARG-100-001", lexile_score: 1380, genre: "Argumentative",
    topic: "Post-Colonialism", length_type: "Short",
    grade_hint: "\uB300\uD5591", vocabulary_band: "C1", intended_use: "\uC218\uC5C5",
    text_body: "Post-colonial scholarship compels a fundamental reassessment of the epistemological frameworks through which non-Western societies have historically been represented in academic discourse. It is insufficient merely to incorporate previously marginalized voices into existing analytical paradigms, as such inclusion risks reproducing the very hierarchies it purports to dismantle. Rather, a thoroughgoing decolonization of knowledge production necessitates interrogating the foundational categories, such as rationality, progress, and development, that have been uncritically universalized from their particular European origins to serve as ostensibly neutral standards of evaluation."
  },
  {
    text_id: "L1300-ARG-200-001", lexile_score: 1360, genre: "Argumentative",
    topic: "Digital Ethics", length_type: "Medium",
    grade_hint: "\uB300\uD5591", vocabulary_band: "B2/C1", intended_use: "\uC218\uC5C5",
    text_body: "The proliferation of algorithmic decision-making systems across domains ranging from criminal justice to healthcare allocation necessitates urgent philosophical scrutiny of the ethical assumptions embedded within their design and deployment. Proponents argue that algorithmic systems offer objectivity and consistency unattainable through human judgment alone, yet this characterization obscures the extent to which such systems inevitably encode the biases present in their training data and reflect the normative commitments of their developers. The juxtaposition of purported technological neutrality with demonstrable patterns of discriminatory outcomes reveals a fundamental tension that cannot be resolved through technical refinement alone but demands engagement with substantive questions of justice and accountability. When an algorithm systematically disadvantages particular demographic groups, attributing responsibility becomes problematic within frameworks designed to evaluate individual human agency rather than distributed sociotechnical systems. It is therefore argued that meaningful digital ethics must extend beyond procedural transparency, important though such transparency undoubtedly is, to encompass critical examination of the power structures that determine which values are optimized, whose interests are prioritized, and what constitutes an acceptable distribution of algorithmic risk. Without such examination, the deployment of ostensibly neutral technologies risks entrenching existing inequalities under the legitimizing veneer of computational objectivity."
  },
  {
    text_id: "L1300-ARG-350-001", lexile_score: 1460, genre: "Argumentative",
    topic: "Economic Inequality Theories", length_type: "Long",
    grade_hint: "\uB300\uD5592", vocabulary_band: "C1", intended_use: "\uB2E4\uB3C5",
    text_body: "Prevailing theoretical accounts of economic inequality may be broadly categorized into those that attribute distributional outcomes primarily to market mechanisms and those that foreground structural and institutional determinants. Neoclassical economic theory, grounded in marginal productivity analysis, contends that individuals are compensated in accordance with their contribution to productive output, implying that observed inequalities reflect differential endowments of human capital and effort. This framework, however, has been subjected to sustained critique for its failure to account for the manifestly non-meritocratic dimensions of wealth accumulation, including inheritance, rent-seeking behavior, and the structural advantages conferred by existing concentrations of economic and political power. Institutional economists, drawing upon the work of scholars such as Daron Acemoglu, have argued persuasively that the quality and character of political and economic institutions constitute the primary determinants of long-term distributional outcomes. Nations characterized by extractive institutions, which concentrate resources among narrow elites, tend to exhibit persistently higher levels of inequality than those with inclusive institutions that distribute economic opportunity more broadly. This institutional perspective illuminates why ostensibly similar economic policies produce divergent outcomes across different national contexts. Marxian analysis offers a further dimension by emphasizing that inequality is not an aberration within capitalism but rather an inherent structural feature arising from the exploitative relationship between capital and labor. From this perspective, ameliorative policy interventions, however well intentioned, are ultimately insufficient because they fail to address the fundamental dynamics of surplus extraction that generate inequality systematically. It is contended here that an adequate theoretical account of economic inequality must integrate insights from these competing frameworks rather than treating them as mutually exclusive alternatives. Market dynamics, institutional structures, and class relations operate simultaneously and interact in complex ways that no single theoretical lens can fully capture. A synthetic approach, one that acknowledges the explanatory contributions of each tradition while recognizing their respective limitations, offers the most promising foundation for both scholarly understanding and effective policy formulation aimed at reducing inequality in its multiple dimensions."
  },
  {
    text_id: "L1300-LIT-100-001", lexile_score: 1320, genre: "Literary",
    topic: "Modernism in Literature", length_type: "Short",
    grade_hint: "\uB300\uD5591", vocabulary_band: "B2/C1", intended_use: "\uC218\uC5C5",
    text_body: "Literary modernism emerged as a sustained interrogation of the representational conventions that had governed nineteenth-century realism, challenging the assumption that narrative could transparently mediate between language and experience. Writers such as Woolf and Joyce deployed techniques of stream-of-consciousness narration not merely as stylistic innovation but as an epistemological statement regarding the fragmented and subjective nature of perception itself. The resulting texts demanded that readers abandon expectations of linear coherence and instead engage actively in the construction of meaning from deliberately indeterminate textual structures."
  },
  {
    text_id: "L1300-LIT-200-001", lexile_score: 1400, genre: "Literary",
    topic: "Aesthetics and Philosophy", length_type: "Medium",
    grade_hint: "\uB300\uD5592", vocabulary_band: "C1", intended_use: "\uC218\uC5C5",
    text_body: "The relationship between aesthetic experience and philosophical understanding has constituted a persistent theme within Western intellectual tradition, from Plato's ambivalent treatment of artistic mimesis to contemporary debates regarding the cognitive value of literature. Kantian aesthetics, which situated the beautiful within the domain of disinterested contemplation, established a framework that simultaneously elevated art's autonomy and circumscribed its epistemological significance. Subsequent theorists, particularly those working within the hermeneutic tradition inaugurated by Gadamer, have challenged this segregation by arguing that aesthetic engagement constitutes a distinctive mode of understanding irreducible to propositional knowledge. The implications of this position extend beyond purely academic concern, insofar as they bear upon fundamental questions regarding what forms of knowledge are recognized as legitimate within institutional frameworks. If aesthetic experience affords genuine insight into the human condition, then the marginalization of the humanities within contemporary educational policy reflects not merely pragmatic resource allocation but a substantive epistemological commitment that warrants critical examination. Martha Nussbaum has argued compellingly that literary engagement cultivates capacities for empathetic imagination and ethical reasoning that are essential to democratic citizenship, suggesting that the value of aesthetic experience cannot be adequately assessed through the instrumentalist metrics increasingly applied to educational outcomes. Such arguments invite reconsideration of the assumptions governing how intellectual inquiry is organized and evaluated within institutional contexts."
  }
];

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function countSentences(text) {
  const matches = text.match(/[.!?]+(?:\s|$)/g);
  return matches ? matches.length : 0;
}

// Print stats
for (const p of passages) {
  const wc = countWords(p.text_body);
  const sc = countSentences(p.text_body);
  const avg = (wc / sc).toFixed(1);
  console.log(`${p.text_id} | words=${wc} | sentences=${sc} | avg_sl=${avg}`);
}

// Build CSV
function escapeCSV(val) {
  const s = String(val);
  return '"' + s.replace(/"/g, '""') + '"';
}

const headers = [
  "text_id","lexile_band","lexile_score","age_group","grade_hint","genre","topic",
  "word_count","length_type","text_body","sentence_count","avg_sentence_length",
  "vocabulary_band","intended_use","created_date","notes"
];

let csv = headers.map(h => escapeCSV(h)).join(',') + '\n';

for (const p of passages) {
  const wc = countWords(p.text_body);
  const sc = countSentences(p.text_body);
  const avg = (wc / sc).toFixed(1);
  const notes = `Academic dense prose; ${p.length_type.toLowerCase()} length; layered subordination and nominalization`;

  const row = [
    p.text_id, "1300-1500", p.lexile_score, "Academic", p.grade_hint,
    p.genre, p.topic, wc, p.length_type, p.text_body,
    sc, avg, p.vocabulary_band, p.intended_use, "2026-02-03", notes
  ];

  csv += row.map(v => escapeCSV(v)).join(',') + '\n';
}

const path = require('path');
const outPath = path.join(__dirname, 'band-1300-1500.csv');
fs.writeFileSync(outPath, '\uFEFF' + csv, 'utf8');
console.log('Output path: ' + outPath);
console.log('\nCSV written successfully. Total rows: ' + passages.length);
