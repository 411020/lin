const STORAGE_KEY = 'vocabFlashcards';
const defaultWords = [
  {
    word: 'inspire',
    translation: '啟發、激勵',
    pos: 'verb',
    example: 'The teacher’s story inspired the students to try harder.',
    root: 'spire = breathe, 類似 inspire 表示「鼓舞、激發」'
  },
  {
    word: 'curious',
    translation: '好奇的',
    pos: 'adjective',
    example: 'She was curious about the new technology.',
    root: 'curio + us, related to curiosity'
  }
];

const state = {
  words: [],
  currentIndex: 0,
  editIndex: null
};

const elements = {
  flashcard: document.getElementById('flashcard'),
  cardWord: document.getElementById('cardWord'),
  cardTranslation: document.getElementById('cardTranslation'),
  cardPos: document.getElementById('cardPos'),
  cardExample: document.getElementById('cardExample'),
  cardRoot: document.getElementById('cardRoot'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  flashcardSection: document.getElementById('flashcardSection'),
  manageSection: document.getElementById('manageSection'),
  flashcardTab: document.getElementById('flashcardTab'),
  manageTab: document.getElementById('manageTab'),
  wordForm: document.getElementById('wordForm'),
  wordInput: document.getElementById('wordInput'),
  translationInput: document.getElementById('translationInput'),
  posInput: document.getElementById('posInput'),
  exampleInput: document.getElementById('exampleInput'),
  rootInput: document.getElementById('rootInput'),
  autoFillBtn: document.getElementById('autoFillBtn'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  saveWordBtn: document.getElementById('saveWordBtn'),
  wordList: document.getElementById('wordList'),
  autoFillStatus: document.getElementById('autoFillStatus')
};

function loadWords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state.words = JSON.parse(saved);
    } catch (error) {
      state.words = [...defaultWords];
    }
  } else {
    state.words = [...defaultWords];
  }
}

function saveWords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.words));
}

function updateCard() {
  const wordEntry = state.words[state.currentIndex];
  if (!wordEntry) return;
  elements.cardWord.textContent = wordEntry.word;
  elements.cardTranslation.textContent = wordEntry.translation || '-';
  elements.cardPos.textContent = wordEntry.pos || '-';
  elements.cardExample.textContent = wordEntry.example || '-';
  elements.cardRoot.textContent = wordEntry.root || '-';
}

function showCampaignSection(section) {
  if (section === 'manage') {
    elements.flashcardSection.classList.add('d-none');
    elements.manageSection.classList.remove('d-none');
    elements.flashcardTab.classList.remove('active');
    elements.manageTab.classList.add('active');
  } else {
    elements.manageSection.classList.add('d-none');
    elements.flashcardSection.classList.remove('d-none');
    elements.manageTab.classList.remove('active');
    elements.flashcardTab.classList.add('active');
  }
}

function renderWordList() {
  elements.wordList.innerHTML = '';
  if (state.words.length === 0) {
    elements.wordList.innerHTML = '<div class="text-muted">目前沒有任何單字，請新增。</div>';
    return;
  }

  state.words.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'word-item';
    item.innerHTML = `
      <div class="word-item-info">
        <div class="word-title">${entry.word}</div>
        <p class="word-meta">${entry.translation || '未填寫'} · ${entry.pos || '未填寫'}</p>
      </div>
      <div class="word-actions">
        <button class="action-button" data-action="edit" data-index="${index}">編輯</button>
        <button class="action-button danger" data-action="delete" data-index="${index}">刪除</button>
      </div>
    `;
    elements.wordList.appendChild(item);
  });
}

function fillForm(entry = null, index = null) {
  elements.wordInput.value = entry?.word || '';
  elements.translationInput.value = entry?.translation || '';
  elements.posInput.value = entry?.pos || '';
  elements.exampleInput.value = entry?.example || '';
  elements.rootInput.value = entry?.root || '';
  state.editIndex = index;
  elements.saveWordBtn.textContent = index === null ? '儲存單字' : '更新單字';
}

function clearForm() {
  fillForm(null, null);
  elements.autoFillStatus.textContent = '';
}

function addWord(entry) {
  if (state.editIndex !== null) {
    state.words[state.editIndex] = entry;
  } else {
    state.words.push(entry);
    state.currentIndex = state.words.length - 1;
  }
  saveWords();
  renderWordList();
  updateCard();
  clearForm();
}

function deleteWord(index) {
  state.words.splice(index, 1);
  if (state.currentIndex >= state.words.length) {
    state.currentIndex = Math.max(0, state.words.length - 1);
  }
  saveWords();
  renderWordList();
  updateCard();
}

function setFlashcardIndex(index) {
  if (state.words.length === 0) return;
  state.currentIndex = (index + state.words.length) % state.words.length;
  updateCard();
}

function setAutoFillStatus(message, type = 'info') {
  elements.autoFillStatus.textContent = message;
  elements.autoFillStatus.className = 'status ' + (type === 'error' ? 'error' : 'success');
}

async function fetchWordInfo(word) {
  if (!word) {
    setAutoFillStatus('請先輸入英文單字。', 'error');
    return null;
  }

  const info = { word, translation: '', pos: '', example: '', root: '' };
  setAutoFillStatus('正在取得資料，請稍候…');

  try {
    const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (dictResponse.ok) {
      const dictData = await dictResponse.json();
      const first = Array.isArray(dictData) ? dictData[0] : dictData;
      if (first && first.meanings && first.meanings.length > 0) {
        const meaning = first.meanings[0];
        info.pos = meaning.partOfSpeech || '';
        const definition = meaning.definitions?.[0];
        if (definition) {
          info.example = definition.example || definition.definition || '';
        }
      }
    }
  } catch (error) {
    console.warn('Dictionary API failed', error);
  }

  try {
    const transResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`);
    if (transResponse.ok) {
      const transData = await transResponse.json();
      const translatedText = transData.responseData?.translatedText;
      if (translatedText) {
        info.translation = translatedText;
      }
    }
  } catch (error) {
    console.warn('Translation API failed', error);
  }

  if (!info.translation) {
    info.translation = '請補上中文翻譯';
  }
  if (!info.pos) {
    info.pos = '請補上詞性';
  }
  if (!info.example) {
    info.example = '請補上例句';
  }
  info.root = `字根分析：${word.slice(0, 2)}...`;
  return info;
}

function attachEvents() {
  elements.flashcard.addEventListener('click', () => {
    elements.flashcard.classList.toggle('is-flipped');
  });

  elements.prevBtn.addEventListener('click', () => setFlashcardIndex(state.currentIndex - 1));
  elements.nextBtn.addEventListener('click', () => setFlashcardIndex(state.currentIndex + 1));

  elements.flashcardTab.addEventListener('click', (event) => {
    event.preventDefault();
    showCampaignSection('flashcard');
  });
  elements.manageTab.addEventListener('click', (event) => {
    event.preventDefault();
    showCampaignSection('manage');
  });

  elements.wordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = {
      word: elements.wordInput.value.trim(),
      translation: elements.translationInput.value.trim(),
      pos: elements.posInput.value.trim(),
      example: elements.exampleInput.value.trim(),
      root: elements.rootInput.value.trim()
    };
    if (!entry.word) {
      setAutoFillStatus('英文單字為必填。', 'error');
      return;
    }
    addWord(entry);
  });

  elements.autoFillBtn.addEventListener('click', async () => {
    const word = elements.wordInput.value.trim();
    if (!word) {
      setAutoFillStatus('請先輸入要查詢的英文單字。', 'error');
      return;
    }
    elements.autoFillBtn.disabled = true;
    const info = await fetchWordInfo(word);
    elements.autoFillBtn.disabled = false;
    if (info) {
      elements.translationInput.value = info.translation;
      elements.posInput.value = info.pos;
      elements.exampleInput.value = info.example;
      elements.rootInput.value = info.root;
      setAutoFillStatus('自動填入完成。請確認內容後儲存。');
    }
  });

  elements.clearFormBtn.addEventListener('click', () => clearForm());

  elements.wordList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.getAttribute('data-action');
    const index = Number(button.getAttribute('data-index'));
    if (action === 'edit') {
      fillForm(state.words[index], index);
      showCampaignSection('manage');
    }
    if (action === 'delete') {
      if (confirm(`確定刪除 ${state.words[index].word} 嗎？`)) {
        deleteWord(index);
      }
    }
  });
}

function init() {
  loadWords();
  renderWordList();
  updateCard();
  attachEvents();
}

init();
