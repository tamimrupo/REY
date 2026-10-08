-- =============================================================================
-- REY BD -- author bios
-- Populate `authors.bio` for the 20 key authors with the on-tone, fact-checked
-- bios written in the content pass. Safe to re-run: each statement matches by
-- name and simply overwrites the bio.
-- =============================================================================


update authors set bio = $$Bengal's towering literary figure and the first non-European to win the Nobel Prize in Literature, Rabindranath Tagore was a poet, novelist, composer, and artist whose work reshaped Bengali culture. His verse collection Gitanjali earned him the Nobel in 1913, and his songs "Amar Shonar Bangla" and "Jana Gana Mana" became the national anthems of Bangladesh and India. For Bengali readers he remains the defining voice of the region's spiritual and artistic heritage.$$ where name = 'Rabindranath Tagore';

update authors set bio = $$The National Poet of Bangladesh, Kazi Nazrul Islam earned the title "Bidrohi Kobi" (Rebel Poet) for poems like Bidrohi that thundered against oppression and injustice. A prolific composer and lyricist, he also created the beloved body of songs known as Nazrul Geeti. His fearless voice for freedom and equality makes him a cornerstone of Bengali literary identity.$$ where name = 'Kazi Nazrul Islam';

update authors set bio = $$Bangladesh's most beloved contemporary storyteller, Humayun Ahmed was a novelist, dramatist, and filmmaker whose characters like Himu and Misir Ali became household names. Works such as Nondito Noroke and Shonkhonil Karagar, along with his hugely popular television dramas, transformed how Bangladeshis consumed stories. His warm, humorous prose earned him an unmatched place in the hearts of Bengali readers.$$ where name = 'Humayun Ahmed';

update authors set bio = $$A Bengali filmmaker and writer of world renown, Satyajit Ray is celebrated for the Apu Trilogy, beginning with Pather Panchali, which brought Indian cinema to international attention. He also created the much-loved detective Feluda, whose adventures delighted generations of readers. His gift for storytelling in both film and print made him a defining figure of Bengali culture.$$ where name = 'Satyajit Ray';

update authors set bio = $$One of the most widely read Bengali novelists, Saratchandra Chatterjee wrote with deep compassion for the lives of ordinary people, especially women. Novels like Devdas, Parineeta, and Srikanta remain beloved for their vivid portrayals of rural Bengal and social struggle. His humane, emotional storytelling has kept his work at the heart of Bengali literature for over a century.$$ where name = 'Saratchandra Chatterjee';

-- 'Bankim Chandra Chatterjee' (content spelling) lives under two variant
-- spellings of the same author; set both so either author page shows the bio.
update authors set bio = $$A pioneer of the modern Bengali novel, Bankim Chandra Chatterjee helped give Bengali prose its literary voice. His historical and social novels, most famously Anandamath — from which the song "Vande Mataram" comes — stirred a spirit of national awakening. He is remembered as one of the founding figures of Bengali literature.$$ where name in ('Bankim Chandra Chatterji', 'Bankim Chandra Chattopadhyay');

update authors set bio = $$A master of Bengali nonsense verse and children's literature, Sukumar Ray delighted readers with the wordplay and whimsy of his classic Abol Tabol. He was also the father of filmmaker Satyajit Ray. His imaginative, playful genius made him a one-of-a-kind treasure in Bengali letters.$$ where name = 'Sukumar Ray';

update authors set bio = $$A Bangladeshi physicist, academic, and one of the country's most prolific writers, Muhammed Zafar Iqbal is best known for his science fiction and fiction for young readers. His novels have inspired a love of science and reading in generations of Bangladeshi students. A professor at Shahjalal University of Science and Technology, he remains a leading voice in Bengali popular science and literature.$$ where name = 'Muhammed Zafar Iqbal';

update authors set bio = $$A Bengali author, linguist, and traveller, Syed Mujtaba Ali charmed readers with his witty, erudite prose. His travel memoir Deshe Bideshe is a beloved classic of Bengali literature. Known for his sparkling humour and broad learning, he remains one of Bengal's most entertaining writers.$$ where name = 'Syed Mujtaba Ali';

update authors set bio = $$A Bangladeshi writer and activist, Jahanara Imam is best known for Ekattorer Dinguli, her searing memoir of the 1971 Liberation War and the loss of her son Rumi. Her courage in speaking out later made her a leading voice of the movement to hold war criminals accountable. Her work stands as a powerful testament to the nation's struggle for freedom.$$ where name = 'Jahanara Imam';

update authors set bio = $$The English novelist and essayist George Orwell wrote with unflinching clarity about power, truth, and injustice. His dystopian classic Nineteen Eighty-Four and the satirical fable Animal Farm remain among the most influential books of the twentieth century. His name became a byword for sharp political insight and plain, honest prose.$$ where name = 'George Orwell';

update authors set bio = $$Often called the "King of Horror," American author Stephen King has shaped modern popular fiction across an astonishing range of genres. Novels such as Carrie, The Shining, It, and The Stand have spawned countless adaptations and devoted readers worldwide. His storytelling blends ordinary life with the supernatural, making fear feel startlingly close to home.$$ where name = 'Stephen King';

update authors set bio = $$The best-selling novelist in history and the undisputed "Queen of Crime," Agatha Christie created the iconic detectives Hercule Poirot and Miss Marple. Masterpieces like Murder on the Orient Express and And Then There Were None made the murder mystery an art form. Her ingeniously plotted whodunits remain endlessly reread and adapted around the world.$$ where name = 'Agatha Christie';

update authors set bio = $$The great Victorian novelist Charles Dickens chronicled the lives of London's poor with humour, indignation, and enormous heart. Beloved works such as Oliver Twist, A Christmas Carol, Great Expectations, and A Tale of Two Cities made him the most popular writer of his age. His vivid characters and social conscience still resonate powerfully today.$$ where name = 'Charles Dickens';

update authors set bio = $$Canadian clinical psychologist and professor Jordan B. Peterson rose to international prominence as a public intellectual and author. His bestseller 12 Rules for Life: An Antidote to Chaos blends psychology, philosophy, and practical advice on responsibility and meaning. His lectures and writing have sparked wide, often passionate, public debate.$$ where name = 'Jordan B. Peterson';

update authors set bio = $$American author Sarah J. Maas has become one of the defining voices of modern fantasy romance. Her sprawling series Throne of Glass and A Court of Thorns and Roses have built a devoted global following. Her blend of rich worlds, high stakes, and compelling romance keeps readers eagerly returning for more.$$ where name = 'Sarah J. Maas';

update authors set bio = $$One of the most celebrated theoretical physicists of his time, Stephen Hawking transformed our understanding of black holes and the origins of the universe. His book A Brief History of Time brought profound scientific ideas to millions of ordinary readers. Despite living with motor neurone disease, he became a worldwide symbol of curiosity and resilience.$$ where name = 'Stephen Hawking';

update authors set bio = $$American novelist and screenwriter George R. R. Martin is the creator of A Song of Ice and Fire, the epic fantasy series adapted as the hit show Game of Thrones. His richly layered worlds, morally complex characters, and willingness to subvert expectations redefined modern fantasy. His work has earned him a devoted, globe-spanning readership.$$ where name = 'George R. R. Martin';

update authors set bio = $$American author Colleen Hoover is one of the most popular writers of contemporary romance and women's fiction today. Novels such as It Ends With Us and Verity have topped bestseller lists and won her a massive, passionate fanbase. Her emotionally charged stories explore love, loss, and the complexities of relationships.$$ where name = 'Colleen Hoover';

update authors set bio = $$American author Dan Brown mastered the fast-paced intellectual thriller, most famously in The Da Vinci Code. His Robert Langdon series, which also includes Angels & Demons and Inferno, blends art, history, and code-breaking into page-turning suspense. His books have been translated into dozens of languages and adapted into major films.$$ where name = 'Dan Brown';
