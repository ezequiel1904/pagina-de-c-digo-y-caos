document.addEventListener('DOMContentLoaded', () => {
      // --- DATOS DEL JUEGO (Simulando una base de datos) ---
      const characters = [
        { id: 'guerrero', name: 'Guerrero', image: 'images/personaje_Guerrero.png' },
        { id: 'mago', name: 'Mago', image: 'images/Personaje_mago.png' }
      ];

      const micas = [
        {
          id: 'depuracion_emergencia',
          name: 'Depuración de Emergencia',
          type: 'Hechizo (H)',
          image: 'images/depurador.png',
          description: 'Una carta de "pánico" si la situación se complica.'
        },
        {
          id: 'golem_algoritmico',
          name: 'Gólem Algorítmico',
          type: 'Principal (P)',
          image: 'images/golem-algoritmico.png',
          description: 'Invoca una criatura para que luche por ti.'
        }
      ];
      
      const templates = {
        ataque: `función Ataque(objetivo) {\n  daño = 50;\n  objetivo.salud -= daño;\n  notificar("Ataque directo de 50 pts.");\n}`,
        defensa: `función Escudo() {\n  otorgar_escudo(30);\n  estado = "Defensa activa";\n  notificar("Escudo de 30 pts. activado.");\n}`,
        utilidad: `función RobarCarta() {\n  robar(1);\n  notificar("Robas 1 carta del mazo.");\n}`
      };

      // --- ESTADO DE LA APLICACIÓN ---
      let selectedCharacter = null;
      let selectedMica = null;

      // --- ELEMENTOS DEL DOM ---
      const characterSelector = document.getElementById('character-selector');
      const micaSelector = document.getElementById('mica-selector');
      const editorContainer = document.getElementById('editor-container');
      const editorPlaceholder = document.getElementById('editor-placeholder');
      // const cardEditor = document.getElementById('card-editor'); // Ya no usamos el textarea directamente
      
      const finalCardImage = document.getElementById('final-card-image');
      const finalCardTitle = document.getElementById('final-card-title');
      const finalCardType = document.getElementById('final-card-type');
      const finalCardDescription = document.getElementById('final-card-description');

      // --- CODEMIRROR SETUP ---
      let editor;

      function initEditor() {
        // Definir palabras clave para el autocompletado
        const gameKeywords = [
          'Ataque', 'Defensa', 'Curación', 'Escudo', 'RobarCarta', 
          'daño', 'salud', 'objetivo', 'notificar', 'estado', 
          'otorgar_escudo', 'robar', 'invocar', 'destruir'
        ];

        CodeMirror.registerHelper("hint", "gameKeywords", function(editor) {
          const cur = editor.getCursor();
          const token = editor.getTokenAt(cur);
          const start = token.start;
          const end = cur.ch;
          const line = cur.line;
          const currentWord = token.string;
          
          const list = gameKeywords.filter(function(item) {
            return item.toLowerCase().startsWith(currentWord.toLowerCase());
          });

          return {
            list: list,
            from: CodeMirror.Pos(line, start),
            to: CodeMirror.Pos(line, end)
          };
        });

        editor = CodeMirror.fromTextArea(document.getElementById('card-editor'), {
          mode: 'javascript',
          theme: 'dracula',
          lineNumbers: true,
          lineWrapping: true,
          extraKeys: {
            "Ctrl-Space": "autocomplete"
          },
          hintOptions: { hint: CodeMirror.hint.gameKeywords }
        });

        editor.on('change', () => {
          updateCardPreview();
        });
        
        // Activar autocompletado al escribir
        editor.on("inputRead", function(cm, change) {
            if (change.origin !== "+input" || change.text[0] === " " || change.text[0] === ";") return;
            CodeMirror.commands.autocomplete(cm, null, {completeSingle: false});
        });
      }

      // --- FUNCIONES ---
      
      // Función para renderizar items seleccionables
      function renderSelectableItems(container, items, type) {
        container.innerHTML = '';
        items.forEach(item => {
          const itemEl = document.createElement('div');
          itemEl.className = 'selectable-item';
          itemEl.dataset.id = item.id;
          itemEl.innerHTML = `<img src="${item.image}" alt="${item.name}"><span>${item.name}</span>`;
          
          itemEl.addEventListener('click', () => handleSelection(type, item, itemEl));
          container.appendChild(itemEl);
        });
      }

      // Función para manejar la selección de personaje y mica
      function handleSelection(type, item, element) {
        if (type === 'character') {
          selectedCharacter = item;
          updateSelectionUI(characterSelector, element);
        } else if (type === 'mica') {
          selectedMica = item;
          updateSelectionUI(micaSelector, element);
          updateCardPreview();
        }
        checkEditorVisibility();
      }
      
      // Función para actualizar la UI de selección
      function updateSelectionUI(container, selectedElement) {
        // Quita la clase 'selected' de todos los elementos en el contenedor
        container.querySelectorAll('.selectable-item').forEach(el => el.classList.remove('selected'));
        // Agrega la clase 'selected' al elemento clickeado
        selectedElement.classList.add('selected');
      }

      // Función para mostrar/ocultar el editor
      function checkEditorVisibility() {
        if (selectedCharacter && selectedMica) {
          editorPlaceholder.style.display = 'none';
          editorContainer.style.display = 'block';
          // Refrescar CodeMirror para que se renderice correctamente cuando se hace visible
          if(editor) editor.refresh();
        } else {
          editorPlaceholder.style.display = 'block';
          editorContainer.style.display = 'none';
        }
      }

      // Función para actualizar la vista previa de la carta
      function updateCardPreview() {
        if (selectedMica) {
          finalCardImage.style.backgroundImage = `url(${selectedMica.image})`;
          finalCardImage.textContent = ''; // Limpiar texto de placeholder
          finalCardTitle.textContent = selectedMica.name;
          finalCardType.textContent = `${selectedMica.type} - Creada por ${selectedCharacter ? selectedCharacter.name : 'Invocador'}`;
        }
        
        const code = editor ? editor.getValue() : '';
        if(code){
            finalCardDescription.textContent = code;
        } else {
            finalCardDescription.textContent = selectedMica ? selectedMica.description : 'El efecto de tu código aparecerá aquí.';
        }
      }

      // Event listener para el editor de texto (YA NO ES NECESARIO, SE MANEJA EN CODEMIRROR)
      // cardEditor.addEventListener('input', updateCardPreview);
      
      // Event listeners para los botones de plantilla
      document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const templateKey = btn.dataset.template;
          if (templates[templateKey] && editor) {
            editor.setValue(templates[templateKey]);
            // updateCardPreview se llama automáticamente por el evento change
          }
        });
      });

      // --- INICIALIZACIÓN ---
      renderSelectableItems(characterSelector, characters, 'character');
      renderSelectableItems(micaSelector, micas, 'mica');
      initEditor();
    });
