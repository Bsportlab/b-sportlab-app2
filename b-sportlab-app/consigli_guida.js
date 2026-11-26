import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { s, LIME, LIME_DARK, LIME_TEXT } from './stile';

export const CONSIGLI_DATA = [
  {
    id: "chimica",
    category: "cucina",
    catLabel: "🍳 Cucina & Cibo",
    icon: "🧪",
    title: "Chimica, Microplastiche e Interferenti Endocrini",
    subtitle: "Proteggi il tuo sistema ormonale dalle sostanze invisibili.",
    summary: "La qualità del cibo dipende anche dai materiali con cui entra a contatto in cottura e conservazione.",
    color: "#EFF6FF",
    border: "#BFDBFE",
    badgeColor: "#1E40AF",
    badgeBg: "#DBEAFE",
    points: [
      {
        titolo: "Padelle antiaderenti rovinate (PFAS e PTFE)",
        testo: "Le padelle antiaderenti con rivestimento graffiato o sfaldato vanno sostituite subito. A temperature elevate rilasciano microparticelle e composti perfluorurati (PFAS), noti interferenti endocrini che tendono ad accumularsi nei tessuti e possono alterare la funzione tiroidea e ormonale.",
        consiglio: "Usa padelle integre a fuoco moderato, oppure passa gradualmente a materiali eterni e chimicamente inerti come acciaio inox 18/10, ghisa o ceramica certificata. Mai usare posate di metallo su superfici antiaderenti."
      },
      {
        titolo: "Bottiglie d’acqua in PET e calore estivo",
        testo: "Le comuni bottiglie monouso per acqua minerale sono in PET (polietilene tereftalato) e sono prive di Bisfenolo A (BPA). Tuttavia, se esposte a fonti di calore (come l’abitacolo di un’auto al sole estivo che supera i 60-70°C), il calore accelera esponenzialmente la migrazione nell’acqua di triossido di antimonio (usato nella sintesi del PET), ftalati e nanoplastiche.",
        consiglio: "Non lasciare mai scorte d’acqua al sole o in auto. Per la quotidianità e lo sport, prediligi borracce in acciaio inox termico o bottiglie in vetro."
      },
      {
        titolo: "Residui chimici e pesticidi: quando il Biologico conta",
        testo: "Non occorre comprare tutto biologico: conta farlo per i vegetali a buccia sottile e porosa che assorbono maggiormente i trattamenti (fragole, mele, frutti di bosco, uva, spinaci). Per alimenti a buccia spessa (banane, avocado, arance) il prodotto convenzionale è altrettanto sicuro.",
        consiglio: "Lava sempre frutta e verdura sotto acqua corrente strofinando con cura. L’ammollo con un cucchiaino di bicarbonato aiuta a rimuovere impurità e sporco superficiale."
      },
      {
        titolo: "La regola dell’etichetta corta",
        testo: "Meno ingredienti compaiono sull’etichetta di un alimento confezionato, più è vicino al suo stato naturale. Diffida da elenchi infiniti di emulsionanti, addensanti, esaltatori di sapidità e coloranti.",
        consiglio: "Se un prodotto contiene più di 5 ingredienti o nomi chimici impronunciabili, è un alimento ultra-processato: riducine il consumo abituale a favore di cibi freschi e integri."
      }
    ]
  },
  {
    id: "cottura",
    category: "cucina",
    catLabel: "🍳 Cucina & Cibo",
    icon: "🔥",
    title: "Metodi di Cottura: Nutrienti e Tossine",
    subtitle: "Cucinare bene significa nutrire il corpo senza creare composti infiammatori.",
    summary: "Il calore trasforma i cibi: una cottura dolce aumenta la digeribilità, una cottura violenta crea composti tossici.",
    color: "#FFF7ED",
    border: "#FED7AA",
    badgeColor: "#C2410C",
    badgeBg: "#FFEDD5",
    points: [
      {
        titolo: "I metodi di cottura virtuosi da favorire",
        testo: "La cottura a vapore è il metodo principe: mantiene intatte le vitamine termolabili (vitamina C e gruppo B), preserva polifenoli e minerali che altrimenti si perderebbero nell’acqua di bollitura. Ottime anche la stufatura dolce con coperchio e la cottura in forno a temperature controllate (150-175°C).",
        consiglio: "Cuoci le verdure al dente: mantenerle croccanti ne preserva il patrimonio vitaminico e riduce l’impatto glicemico del pasto."
      },
      {
        titolo: "Parti annerite e bruciate (Acrilamide e IPA)",
        testo: "Le zone nere o eccessivamente bruciacchiate su pizza, pane, patate al forno e carne alla griglia contengono acrilamide, idrocarburi policiclici aromatici (IPA) e ammine eterocicliche, composti pro-infiammatori e potenzialmente cancerogeni.",
        consiglio: "Non consumare mai le parti bruciate: scartale accuratamente con il coltello. Nelle cotture al forno mantieni temperature inferiori a 180°C."
      },
      {
        titolo: "Gestione corretta dell’Olio Extravergine d’Oliva",
        testo: "L’olio EVO è ricco di polifenoli e antiossidanti che resistono bene al calore, ma non deve mai raggiungere il 'punto di fumo' (quando comincia a fumare in padella si decompone liberando acroleina, irritante per il fegato).",
        consiglio: "Usa un velo d’olio EVO per le cotture veloci, ma aggiungi la quota principale del tuo condimento a crudo direttamente nel piatto per preservarne intatti i preziosi grassi e la vitamina E."
      }
    ]
  },
  {
    id: "conservazione",
    category: "cucina",
    catLabel: "🍳 Cucina & Cibo",
    icon: "❄️",
    title: "Conservazione Cibi e Sicurezza nel Meal Prep",
    subtitle: "Pasti pronti, sani e sicuri: come organizzare frigo e freezer.",
    summary: "Un meal prep efficiente ti fa risparmiare tempo, ma richiede regole igieniche rigorose contro i batteri.",
    color: "#F0FDFA",
    border: "#99F6E4",
    badgeColor: "#0F766E",
    badgeBg: "#CCFBF1",
    points: [
      {
        titolo: "La regola delle 2 ore nel raffreddamento",
        testo: "Lasciare riso, pasta o carne cotta a temperatura ambiente per molte ore ad intiepidire è un grave errore: la fascia tra 15°C e 55°C è la zona di massima moltiplicazione batterica.",
        consiglio: "Dividi il cibo cotto in contenitori di vetro bassi per accelerarne il raffreddamento e riponilo in frigorifero entro 60-90 minuti dalla cottura."
      },
      {
        titolo: "L’insidia del riso cotto (Bacillus cereus)",
        testo: "I cereali e il riso cotti lasciati a lungo a temperatura ambiente possono sviluppare le spore del Bacillus cereus, che producono tossine resistenti al calore (riscaldare il riso in padella non le distrugge).",
        consiglio: "Riso e pasta cotti per il meal prep vanno conservati in contenitori ermetici in frigorifero e consumati entro 48-72 ore al massimo."
      },
      {
        titolo: "Scongelamento sicuro",
        testo: "Non scongelare mai carne, pesce o cibi pronti lasciandoli sul lavello a temperatura ambiente. La superficie esterna si scalda rapidamente proliferando di batteri mentre il cuore è ancora ghiacciato.",
        consiglio: "Scongela sempre trasferendo il cibo dal freezer al frigorifero la sera prima, oppure utilizza la funzione Defrost del microonde se devi cucinare subito."
      }
    ]
  },
  {
    id: "stagionalita",
    category: "cucina",
    catLabel: "🍳 Cucina & Cibo",
    icon: "🌈",
    title: "Stagionalità, Rotazione e Varietà Alimentare",
    subtitle: "Nutri il tuo microbiota e massimizza l'introito di micronutrienti.",
    summary: "Mangiare sempre gli stessi 4 cibi impoverisce la flora intestinale. La salute nasce dalla varietà.",
    color: "#FEFCE8",
    border: "#FEF08A",
    badgeColor: "#A16207",
    badgeBg: "#FEF9C3",
    points: [
      {
        titolo: "Perché mangiare di stagione è una scelta nutrizionale",
        testo: "Un vegetale colto a maturazione naturale sotto il sole sintetizza fino al doppio di polifenoli, flavonoidi e vitamine rispetto a un ortaggio fatto maturare forzatamente in serra riscaldata o cella frigorifera. Inoltre richiede meno trattamenti e offre un sapore nettamente superiore.",
        consiglio: "Segui il calendario della natura: consuma agrumi, crucifere e radicchi in inverno; pomodori, pesche e zucchine in estate."
      },
      {
        titolo: "Rotazione delle fonti per il microbiota intestinale",
        testo: "Mangiare riso e pollo tutti i giorni riduce la biodiversità batterica del colon. Ciascun cereale (orzo, farro, quinoa, avena, grano saraceno) apporta fibre prebiotiche diverse che nutrono ceppi batterici differenti, potenziando le difese immunitarie.",
        consiglio: "Varia settimanalmente le fonti proteiche tra pesce azzurro (Omega-3), carni magre, uova, legumi e latticini magri."
      },
      {
        titolo: "La regola dei 5 colori a tavola",
        testo: "Ciascun colore naturale nei vegetali corrisponde a specifici antiossidanti: Rosso (licopene protettivo cardiovascolare), Arancione (beta-carotene e vitamina A), Verde (folati, luteina e clorofilla), Blu/Viola (antociani antinfiammatori per il microcircolo), Bianco (quercetina e allicina antibatterica).",
        consiglio: "Punta ad assumere almeno 3-4 colori vegetali diversi ogni giorno per coprire l’intero spettro dei micronutrienti protettivi."
      }
    ]
  },
  {
    id: "idratazione",
    category: "corpo",
    catLabel: "🧬 Salute & Corpo",
    icon: "💧",
    title: "Idratazione Strategica nello Sport e nella Vita",
    subtitle: "L'acqua è il primo e più potente integratore per la performance.",
    summary: "Il muscolo è per oltre il 70% acqua: se manca l'acqua cala la forza, rallenta il recupero e sale la fatica.",
    color: "#F0F9FF",
    border: "#BAE6FD",
    badgeColor: "#0369A1",
    badgeBg: "#E0F2FE",
    points: [
      {
        titolo: "Il costo biologico della disidratazione",
        testo: "Una disidratazione di appena il 2% del peso corporeo (circa 1.4 kg di liquidi persi su una persona di 70 kg) provoca un calo del 10-15% della forza esplosiva e della resistenza, aumenta la frequenza cardiaca a parità di sforzo e moltiplica il rischio di crampi e infortuni muscolari.",
        consiglio: "Non aspettare lo stimolo della sete: quando hai sete, sei già parzialmente disidratato a livello intracellulare."
      },
      {
        titolo: "Quanta acqua bere davvero?",
        testo: "La regola generica dei '2 litri per tutti' è superata. Il fabbisogno reale varia in base al peso e all'attività: a riposo servono circa 30-35 ml per kg di peso corporeo (es. 70 kg = 2.1 - 2.4 litri), a cui aggiungere da 500 a 1000 ml per ogni ora di allenamento intenso.",
        consiglio: "Bevi a piccoli sorsi regolari nell’arco della giornata. Tracannare mezzo litro tutto insieme stimola solo la diuresi immediata senza idratare le cellule."
      },
      {
        titolo: "Il risveglio e il test visivo delle urine",
        testo: "Durante la notte il corpo perde liquidi con la respirazione e la traspirazione. Bere 1-2 bicchieri d’acqua appena svegli ripristina il volume ematico e riattiva il tratto gastrointestinale.",
        consiglio: "Controlla il colore delle urine durante la giornata: deve essere giallo paglierino chiaro e limpido. Se è giallo scuro o ambrato, bevi subito due bicchieri d’acqua."
      }
    ]
  },
  {
    id: "alcool",
    category: "corpo",
    catLabel: "🧬 Salute & Corpo",
    icon: "🍷",
    title: "Alcool, Recupero Muscolare e Metabolismo",
    subtitle: "Capire l'impatto dell'etanolo per gestire la vita sociale con intelligenza.",
    summary: "L'organismo riconosce l'alcool come tossina prioritaria: finché lo smaltisce, il consumo dei grassi si arresta.",
    color: "#FFF1F2",
    border: "#FECDD3",
    badgeColor: "#BE123C",
    badgeBg: "#FFE4E6",
    points: [
      {
        titolo: "Calorie vuote e blocco dell’ossidazione dei grassi",
        testo: "L’alcool apporta 7 kcal per grammo prive di nutrienti. Poiché l’etanolo non può essere stoccato, il fegato deve metabolizzarlo subito, bloccando temporaneamente l’ossidazione dei lipidi. Finché l’alcool è in circolo, bruciare i grassi di riserva diventa biologicamente impossibile.",
        consiglio: "Evita l’alcool nelle 24 ore a ridosso di allenamenti pesanti o gare. Il momento peggiore è il post-workout immediato, quando il muscolo richiede nutrienti e reidratazione."
      },
      {
        titolo: "Sintesi proteica e sonno profondo sabotati",
        testo: "L’assunzione di alcool riduce l’attivazione della via mTOR (la sintesi proteica muscolare) fino al 25-30% e frammenta il sonno profondo a onde lente, sopprimendo la naturale secrezione notturna dell’ormone GH.",
        consiglio: "Se bevi alcol la sera, mantieni un intervallo di almeno 2 ore prima di andare a dormire per limitare i danni sulla qualità del sonno."
      },
      {
        titolo: "La regola dell’1:1 e lo stomaco pieno",
        testo: "L’alcool è un forte diuretico che inibisce l’ormone antidiuretico vasopressina, sottraendo liquidi alle cellule muscolari. Bere a stomaco vuoto provoca un picco ematico rapidissimo ed epatotossico.",
        consiglio: "Applica la regola dell’1:1: per ogni calice di vino o bicchiere di birra, bevi un bicchiere pieno d’acqua. E bevi solo durante un pasto completo ricco di fibre e proteine che ne rallentino l’assorbimento."
      }
    ]
  },
  {
    id: "sale_iodato",
    category: "corpo",
    catLabel: "🧬 Salute & Corpo",
    icon: "🧂",
    title: "Sale, Sodio, Sport e l'Importanza del Sale Iodato",
    subtitle: "Il sale non è il nemico: perché usarlo bene protegge tiroide e performance.",
    summary: "Togliere il sale peggiora la ritenzione e affatica i muscoli. L'OMS raccomanda: poco sale, ma sempre iodato.",
    color: "#F8FAFC",
    border: "#CBD5E1",
    badgeColor: "#334155",
    badgeBg: "#E2E8F0",
    points: [
      {
        titolo: "L’importanza fondamentale del SALE IODATO per la tiroide",
        testo: "Lo iodio è il minerale indispensabile per la sintesi degli ormoni tiroidei T3 e T4, i regolatori primari del metabolismo basale, della termogenesi e dell’energia cellulare. Il fabbisogno giornaliero dell'adulto è di circa 150 µg: i cibi comuni (specie non marini) ne contengono quantitativi modesti e variabili. Il sale grezzo o il sale rosa dell’Himalaya NON contengono iodio a sufficienza e non sono fortificati.",
        consiglio: "Segui la direttiva dell’OMS e del Ministero della Salute: 'Poco sale, ma rigorosamente IODATO'. Usare regolarmente sale marino iodato previene il gozzo, protegge la tiroide e mantiene attivo il dispendio energetico."
      },
      {
        titolo: "Il sodio non è il nemico dell’atleta",
        testo: "Chi cerca la definizione muscolare spesso azzera il sale, commettendo un errore madornale. Il sodio è il principale elettrolito del liquido extracellulare: governa la contrazione muscolare, il volume plasmatico ematico e il turgore muscolare (pump). Togliere il sale attiva l’aldosterone, peggiorando paradossalmente la ritenzione idrica e provocando cali di pressione, debolezza e crampi.",
        consiglio: "Sala normalmente i tuoi pasti con sale iodato. Il sodio da evitare è quello 'invisibile' e mascherato dei prodotti industriali pronti e delle patatine, non il pizzico d’oro sulla pasta o sulla verdura."
      }
    ]
  },
  {
    id: "caffeina",
    category: "abitudini",
    catLabel: "🧘 Stile di Vita",
    icon: "☕",
    title: "Caffè e Caffeina: Perché Massimo 3 al Giorno",
    subtitle: "Usa il potere stimolante della caffeina senza bruciare i recettori né il sonno.",
    summary: "Fino a 3 caffè al giorno è una quota ottimale e benefica. Oltre i 3 caffè iniziano i danni su cortisolo e sonno.",
    color: "#FEF2F2",
    border: "#FECACA",
    badgeColor: "#991B1B",
    badgeBg: "#FEE2E2",
    points: [
      {
        titolo: "Perché 3 caffè al giorno è il limite ideale raccomandato (EFSA)",
        testo: "L’Autorità Europea per la Sicurezza Alimentare (EFSA) fissa la soglia di sicurezza a 300-400 mg di caffeina al giorno (circa 3 tazzine di espresso). Oltre questa quota: 1) I recettori dell’adenosina subiscono assuefazione (down-regulation), costringendoti a bere caffè solo per non sentirti stanco; 2) Si iper-stimola l’asse surrenalico con rilascio cronico di cortisolo ed epinefrina a riposo, favorendo tachicardia e ansia; 3) La caffeina in eccesso inibisce l’assorbimento del ferro non-eme fino al 30-40% e aumenta l’escrezione urinaria di calcio e magnesio.",
        consiglio: "Mantieni la quota d’oro: 2-3 caffè al giorno ben distribuiti ti regalano il massimo dei polifenoli protettivi e della lucidità mentale senza alcun effetto collaterale."
      },
      {
        titolo: "Il timing: la regola dei 90 minuti e il coprifuoco pomeridiano",
        testo: "Appena svegli il cortisolo è al suo picco fisiologico: bere subito il caffè ne appiattisce la curva naturale. Inoltre, l’emivita della caffeina è di 5-7 ore (dopo 6 ore metà della caffeina è ancora attiva nel cervello).",
        consiglio: "Aspetta 60-90 minuti dal risveglio prima della prima tazzina. E fissa il coprifuoco alle 14:00-14:30: bere caffè nel tardo pomeriggio impedisce al cervello di raggiungere le onde lente del sonno profondo rigenerante."
      }
    ]
  },
  {
    id: "fame_emotiva",
    category: "abitudini",
    catLabel: "🧘 Stile di Vita",
    icon: "🧠",
    title: "Fame Fisiologica vs Fame Emotiva",
    subtitle: "Imparare a riconoscere i veri segnali del corpo senza sensi di colpa.",
    summary: "La fame biologica nasce dallo stomaco; la fame nervosa nasce da noia, stress o dopamina.",
    color: "#FAF5FF",
    border: "#E9D5FF",
    badgeColor: "#7E22CE",
    badgeBg: "#F3E8FF",
    points: [
      {
        titolo: "Come riconoscerle in 5 secondi",
        testo: "La fame biologica insorge gradualmente, si percepisce fisicamente nello stomaco, accetta qualunque cibo sano (mangeresti volentieri anche petto di pollo e insalata) e si placa quando sei sazio. La fame emotiva insorge all'improvviso, pretende un cibo specifico e iper-palatabile (dolci, snack salati), non parte dallo stomaco ma da uno stato d'animo e spesso lascia rimorso.",
        consiglio: "Chiediti prima di aprire la credenza: 'Mangerei una mela o un piatto di verdure adesso?'. Se la risposta è no, non è fame biologica ma ricerca di dopamina o fuga dallo stress."
      },
      {
        titolo: "La tecnica del bicchiere d’acqua e dei 10 minuti",
        testo: "Il picco dell'impulso dopaminergico è transitorio e dura in media 8-12 minuti. Se rispondi con un'azione di rottura, l'impulso si affievolisce senza sforzo titanico di volontà.",
        consiglio: "Bevi un grande bicchiere d’acqua fresca, allontanati fisicamente dalla cucina e fai una doccia, una camminata o telefona a un amico per 10 minuti. Nel 70% dei casi la finta fame svanisce da sola."
      }
    ]
  },
  {
    id: "digestione",
    category: "corpo",
    catLabel: "🧬 Salute & Corpo",
    icon: "🦷",
    title: "Digestione, Masticazione e Gonfiore Addominale",
    subtitle: "La digestione inizia in bocca: piccoli gesti per sgonfiare la pancia.",
    summary: "Ingoiare il cibo di corsa affatica lo stomaco e provoca fermentazioni intestinali dolorose.",
    color: "#F0FDF4",
    border: "#BBF7D0",
    badgeColor: "#15803D",
    badgeBg: "#DCFCE7",
    points: [
      {
        titolo: "Il ruolo cruciale della masticazione e della ptialina",
        testo: "Lo stomaco non ha i denti. Ingoiare bocconi interi costringe lo stomaco a una secrezione acida massiccia e lascia frammenti indigeriti che arrivano al colon, dove fermentano generando gas e tensione. La saliva contiene ptialina, enzima che scinde gli amidi dei carboidrati già in bocca.",
        consiglio: "Mastica ogni boccone 15-20 volte fino a renderlo una crema prima di deglutire. La pasta e il riso diventeranno incredibilmente più leggeri e sazianti."
      },
      {
        titolo: "Mangiare con calma attiva il sistema parasimpatico",
        testo: "Mangiare in piedi, davanti alle email o guardando il telefono con livelli d’ansia attivi scatena il sistema ortosimpatico (combatti o fuggi), che devia il flusso sanguigno lontano dall'apparato digerente e blocca la secrezione di enzimi.",
        consiglio: "Siediti a tavola, fai tre respiri profondi prima di iniziare e mangia senza schermi accesi. La modalità 'riposa e digerisci' è indispensabile per non gonfiarsi."
      },
      {
        titolo: "Consigli pratici per i legumi",
        testo: "I legumi contengono oligosaccaridi fermentabili che possono provocare meteorismo se il microbiota non è abituato.",
        consiglio: "Inizia con legumi decorticati (lenticchie rosse), sciacqua sempre benissimo quelli in scatola per eliminare le saponine schiumogene e cuocili con una foglia di alloro o semi di finocchio per degradare i composti gassosi."
      }
    ]
  },
  {
    id: "sonno",
    category: "abitudini",
    catLabel: "🧘 Stile di Vita",
    icon: "🌙",
    title: "Sonno e Ormoni del Recupero Muscolare",
    subtitle: "Dormire bene è parte integrante del tuo allenamento e della tua dieta.",
    summary: "Chi dorme poco ha più fame e brucia meno grasso: il sonno è un pilastro biologico.",
    color: "#EEF2FF",
    border: "#C7D2FE",
    badgeColor: "#3730A3",
    badgeBg: "#E0E7FF",
    points: [
      {
        titolo: "L’impatto del sonno su Grelina e Leptina",
        testo: "Dormire meno di 7 ore a notte aumenta del 25% la grelina (l’ormone che scatena la fame famelica) e abbatte la leptina (l’ormone della sazietà). Il giorno dopo una notte insonne il cervello richiede istintivamente carboidrati semplici e zuccheri per compensare il deficit energetico.",
        consiglio: "Non considerare il sonno come un tempo perso: dormire 7-8 ore di qualità è il modo più efficace per controllare l’appetito e preservare la massa magra."
      },
      {
        titolo: "Il picco notturno dell’ormone GH",
        testo: "Oltre il 70% della produzione giornaliera dell’ormone somatotropo (GH) avviene durante le fasi di sonno profondo NREM a onde lente, nella prima metà della notte. Il GH ripara le microlesioni muscolari dell’allenamento e stimola la lipolisi.",
        consiglio: "Mantieni orari di coricamento regolari e spegni computer e smartphone almeno 45 minuti prima di dormire: la luce blu blocca la sintesi di melatonina."
      }
    ]
  },
  {
    id: "spezie",
    category: "cucina",
    catLabel: "🍳 Cucina & Cibo",
    icon: "🌿",
    title: "Spezie, Erbe Aromatiche e Antiossidanti Quotidiani",
    subtitle: "Piccole aggiunte che trasformano un piatto comune in una cura per il metabolismo.",
    summary: "Erbe e spezie hanno la più alta densità di polifenoli al mondo: usale generosamente ogni giorno.",
    color: "#FDF4FF",
    border: "#F5D0FE",
    badgeColor: "#86198F",
    badgeBg: "#FAE8FF",
    points: [
      {
        titolo: "Cannella e sensibilità all'insulina",
        testo: "La cannella contiene polimeri polifenolici che mimano l’azione dell’insulina, migliorando la captazione del glucosio da parte delle cellule muscolari e rallentando lo svuotamento gastrico.",
        consiglio: "Aggiungi mezzo cucchiaino di cannella nel porridge d'avena, nello yogurt greco o sulla mela cotta a colazione o merenda."
      },
      {
        titolo: "Curcuma e pepe nero: sinergia antinfiammatoria",
        testo: "La curcumina è uno dei più potenti antinfiammatori naturali per articolazioni e tendini. Da sola è poco biodisponibile, ma la piperina contenuta nel pepe nero ne moltiplica l’assorbimento fino a 20 volte.",
        consiglio: "Abbina sempre una spolverata di pepe nero e una punta di grasso buono (olio EVO) quando usi la curcuma in cucina."
      },
      {
        titolo: "Rosmarino e salvia sulle carni calde",
        testo: "L'acido carnosico e i flavonoidi del rosmarino e della salvia neutralizzano i radicali liberi generati dalla cottura delle proteine ad alta temperatura.",
        consiglio: "Marina la carne o il pesce con rosmarino, salvia ed erbe mediterranee prima di cuocerli: ridurrai drasticamente i composti ossidati preservando il gusto."
      }
    ]
  },
  {
    id: "diario_libero",
    category: "abitudini",
    catLabel: "🧠 Abitudini & Mente",
    icon: "📖",
    title: "Come Gestire il Diario Libero e la Flessibilità",
    subtitle: "Consapevolezza e libertà nutrizionale senza ansia da bilancia.",
    summary: "Il Diario Libero è una bussola per pasti fuori casa, trasferte o ricette personali: l'obiettivo è la coerenza sui target a fine giornata, non la perfezione maniacale al grammo.",
    color: "#F0FDF4",
    border: "#86EFAC",
    badgeColor: "#166534",
    badgeBg: "#DCFCE7",
    points: [
      {
        titolo: "Regola d'Oro: Coerenza Globale, Non Perfezione Maniacale",
        testo: "Il Diario Libero non deve diventare una gabbia di conteggio ossessivo. Non occorre spaccare il singolo grammo a ogni boccone: l'obiettivo clinico è avvicinarsi ai target giornalieri di Proteine, Carboidrati e Grassi a fine giornata, garantendo energia, recupero muscolare e benessere.",
        consiglio: "Segui la barra scura dei target in cima al diario: si aggiorna in tempo reale mostrandoti calorie e grammi rimanenti man mano che registri i pasti."
      },
      {
        titolo: "Priorità Assoluta alla Quota Proteica",
        testo: "Nei giorni in cui gestisci liberamente i pasti, la priorità numero uno è raggiungere la quota proteica prescritta dal Dott. Baldassarre. Le proteine sono i mattoni della massa magra, sostengono la sazietà e mantengono alto il tasso metabolico.",
        consiglio: "Inizia a pianificare il pasto partendo dalla fonte proteica (carne magra, pesce, uova, tofu, yogurt greco, bresaola) e modula carboidrati e grassi in base a quanto consumato o all'attività fisica prevista."
      },
      {
        titolo: "Pasti Fuori Casa e Ristoranti: Come Regolarsi",
        testo: "Quando mangi al ristorante, in trasferta o con amici, non rinunciare alla convivialità e non smettere di tracciare per paura di sbagliare: usa le stime visive del database con serenità.",
        consiglio: "Punti di riferimento visivi rapidi: 1 piatto di pasta standard al ristorante ~90-100g a crudo; 1 filetto di carne o trancio di pesce grande come il palmo della mano ~150g; 1 cucchiaio da minestra di olio EVO ~9-10g."
      },
      {
        titolo: "Gestione Peso Cotto vs Crudo",
        testo: "Quando cucini per la famiglia o prepari la pasta e il riso per più giorni (meal prep), è normale pesare la porzione già cotta. Nel Diario Libero puoi attivare lo switch 'Peso Cotto': il software applica i coefficienti esatti di resa in cottura e calcola i valori nutrizionali corretti.",
        consiglio: "Ricorda che la pasta e il riso più che raddoppiano il loro peso con l'acqua assorbita (~2.2-2.4x), mentre carne e pesce riducono il proprio peso del 15-20% per perdita di liquidi."
      },
      {
        titolo: "Verdure Abbondanti e Niente 'Digiuni Punitivi'",
        testo: "Se a pranzo hai mangiato di più per una ricorrenza o una pizza, non cadere nella trappola del digiuno serale punitivo: saltare la cena sbilancia la glicemia, aumenta il cortisolo e porta a fame incontrollata il giorno dopo.",
        consiglio: "Consuma verdure a foglia e ortaggi a crudo o al vapore con generosità (ricordando solo di tracciare l'olio impiegato) e alla sera mantieni un pasto leggero e digeribile a base proteica e vegetale."
      }
    ]
  }
];

export function TipsTab({ lang = "it" }) {
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = useMemo(() => {
    return CONSIGLI_DATA.filter((item) => {
      const matchCat = activeCat === "all" || item.category === activeCat;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.points.some((p) => p.titolo.toLowerCase().includes(q) || p.testo.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [activeCat, search]);

  return (
    <View style={{ marginBottom: 30 }}>
      {/* Intestazione */}
      <View style={{ marginBottom: 14 }}>
        <Text style={s.sec}>💡 Guida & Consigli del Nutrizionista</Text>
        <Text style={{ fontSize: 13, color: "#475569", lineHeight: 18 }}>
          Raccomandazioni pratiche basate su evidenze cliniche per ottimizzare la salute, la sicurezza alimentare e il recupero sportivo.
        </Text>
      </View>

      {/* Barra Ricerca Rapida */}
      <View style={{ marginBottom: 12 }}>
        <TextInput
          style={[s.inp, { textAlign: "left", fontSize: 13, paddingHorizontal: 12, outlineStyle: "none" }]}
          placeholder="🔍 Cerca per argomento (es. microplastiche, sale, sonno...)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtri Categoria a Scorrimento Orizzontale */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingHorizontal: 2 }}
        style={{ marginBottom: 16 }}
      >
        {[
          ["all", "Tutte (12)"],
          ["cucina", "🍳 Cucina & Cibo"],
          ["corpo", "🧬 Salute & Corpo"],
          ["abitudini", "🧘 Stile di Vita"],
        ].map(([catKey, catLbl]) => {
          const isAct = activeCat === catKey;
          return (
            <TouchableOpacity
              key={catKey}
              onPress={() => setActiveCat(catKey)}
              style={[
                s.chip,
                isAct && s.chipAct,
                { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, flexShrink: 0 },
              ]}
            >
              <Text style={[s.cTxt, isAct && s.cTxtAct, { fontSize: 12, fontWeight: isAct ? "bold" : "600" }]}>
                {catLbl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista Schede Tematiche Accordion */}
      {filteredData.map((item) => {
        const isExp = Boolean(expandedIds[item.id]);
        return (
          <View
            key={item.id}
            style={[
              s.card,
              {
                padding: 14,
                marginBottom: 14,
                borderColor: item.border,
                backgroundColor: "#FFFFFF",
              },
            ]}
          >
            {/* Header Cliccabile */}
            <TouchableOpacity
              onPress={() => toggleExpand(item.id)}
              style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  <Text style={{ fontSize: 14.5, fontWeight: "800", color: "#0F172A", flex: 1 }}>
                    {item.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>
                  {item.subtitle}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: item.badgeBg,
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: "bold", color: item.badgeColor }}>
                  {isExp ? "▲ Chiudi" : "▼ Leggi"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Dettagli Espansi (Regola d'Oro e Punti di Approfondimento) */}
            {isExp ? (
              <View style={{ marginTop: 12 }}>
                {/* Sommario Regola d'Oro */}
                <View
                  style={{
                    backgroundColor: item.color,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: item.badgeColor,
                  }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: item.badgeColor, marginBottom: 2 }}>
                    ✨ LA REGOLA D'ORO:
                  </Text>
                  <Text style={{ fontSize: 12, color: "#1E293B", lineHeight: 17 }}>
                    {item.summary}
                  </Text>
                </View>

                {/* Punti Dettagliati */}
                <View style={{ gap: 12 }}>
                  {item.points.map((p, pIdx) => (
                    <View
                      key={pIdx}
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderRadius: 8,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0F172A", marginBottom: 4 }}>
                        • {p.titolo}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#334155", lineHeight: 17, marginBottom: 6 }}>
                        {p.testo}
                      </Text>
                      {p.consiglio ? (
                        <View style={{ backgroundColor: "#FFFFFF", padding: 8, borderRadius: 6, borderLeftWidth: 2, borderLeftColor: LIME_DARK }}>
                          <Text style={{ fontSize: 11.5, color: "#15803D", fontWeight: "600" }}>
                            💡 Consiglio pratico: <Text style={{ fontWeight: "400", color: "#334155" }}>{p.consiglio}</Text>
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
