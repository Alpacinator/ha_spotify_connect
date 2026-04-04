// Queue Receiver v1.0.0
(async function () {

	// =========================
	// Configuration
	// =========================
	const CONFIG = {
		defaultHost: '127.0.0.1',
		defaultPort: 5000,
		pollInterval: 2000,
		// The correct container is the one with link-subtle (confirmed by inspecting
		// where the Collapsing Library button lives)
		topbarButtonsSelectors: [
			'.link-subtle.main-topBar-topbarContentRight',
			'.main-topBar-topbarContentRight',
		],
	};

	// =========================
	// localStorage keys
	// =========================
	const KEYS = {
		host: 'spicetify-addon:queue-receiver:host',
		port: 'spicetify-addon:queue-receiver:port',
	};

	// =========================
	// Logging
	// =========================
	const log = {
		prefix: '[QUEUE-RCV]',
		info:  function(...args) { console.log(  this.prefix, ...args); },
		warn:  function(...args) { console.warn( this.prefix, ...args); },
		error: function(...args) { console.error(this.prefix, ...args); },
	};

	// =========================
	// Boot: wait for Spicetify globals
	// =========================
	log.info('Waiting for Spicetify.React and Spicetify.ReactDOM...');
	while (!window.Spicetify?.React || !window.Spicetify?.ReactDOM) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	log.info('Spicetify.React and ReactDOM ready.');

	(() => {
		const { React, ReactDOM } = Spicetify;

		// =========================
		// Settings helpers
		// =========================
		const getSetting = (key, defaultValue) => {
			const stored = localStorage.getItem(key);
			if (stored === null) return defaultValue;
			try { return JSON.parse(stored); } catch { return defaultValue; }
		};

		const setSetting = (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		};

		// =========================
		// SettingsPanel component
		// =========================
		const SettingsPanel = ({ onClose, anchorRect }) => {

			const [host, setHost] = React.useState(getSetting(KEYS.host, CONFIG.defaultHost));
			const [port, setPort] = React.useState(getSetting(KEYS.port, CONFIG.defaultPort));
			const [saved, setSaved] = React.useState(false);

			// Drag logic
			const dragState = React.useRef(null);
			const [pos, setPos] = React.useState(() => ({
				x: anchorRect
					? Math.min(anchorRect.left - 260, window.innerWidth - 320)
					: window.innerWidth - 340,
				y: anchorRect ? anchorRect.bottom + 8 : 60,
			}));

			const onMouseDown = (e) => {
				if (e.target.closest('button') || e.target.closest('input')) return;
				e.preventDefault();
				dragState.current = {
					startX: e.clientX - pos.x,
					startY: e.clientY - pos.y,
				};

				const onMouseMove = (e) => {
					if (!dragState.current) return;
					setPos({
						x: Math.max(0, Math.min(window.innerWidth  - 320, e.clientX - dragState.current.startX)),
						y: Math.max(0, Math.min(window.innerHeight - 120, e.clientY - dragState.current.startY)),
					});
				};

				const onMouseUp = () => {
					dragState.current = null;
					window.removeEventListener('mousemove', onMouseMove);
					window.removeEventListener('mouseup',   onMouseUp);
				};

				window.addEventListener('mousemove', onMouseMove);
				window.addEventListener('mouseup',   onMouseUp);
			};

			// Handlers
			const handleHost = (e) => {
				setHost(e.target.value);
				setSaved(false);
			};

			const handlePort = (e) => {
				const val = Math.min(65535, Math.max(1, parseInt(e.target.value) || 1));
				setPort(val);
				setSaved(false);
			};

			const handleSave = () => {
				setSetting(KEYS.host, host);
				setSetting(KEYS.port, port);
				setSaved(true);
				log.info(`Settings saved — host: ${host}, port: ${port}`);
				Spicetify.showNotification('Queue Receiver: settings saved');
			};

			// Inline styles (match Collapsing Library panel aesthetic)
			const styles = {
				panel: {
					position: 'fixed', left: pos.x, top: pos.y,
					width: 'max-content', minWidth: '300px', maxWidth: '420px',
					background: 'rgba(30,30,30,0.88)',
					backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
					borderRadius: '10px',
					border: '1px solid rgba(255,255,255,0.08)',
					boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
					zIndex: 9999, color: '#fff',
					fontFamily: 'var(--font-family, CircularSp, sans-serif)',
					overflow: 'hidden', userSelect: 'none',
				},
				header: {
					display: 'flex', justifyContent: 'space-between', alignItems: 'center',
					padding: '10px 14px',
					background: 'rgba(255,255,255,0.06)',
					cursor: 'grab',
					borderBottom: '1px solid rgba(255,255,255,0.07)',
				},
				title: {
					fontSize: '13px', fontWeight: '700',
					letterSpacing: '0.04em', color: 'rgba(255,255,255,0.85)', margin: 0,
				},
				closeBtn: {
					background: 'none', border: 'none',
					color: 'rgba(255,255,255,0.4)',
					fontSize: '16px', cursor: 'pointer',
					lineHeight: 1, padding: '2px 4px', borderRadius: '4px',
				},
				body: {
					padding: '10px 14px 14px',
					display: 'flex', flexDirection: 'column', gap: '8px',
				},
				sectionLabel: {
					fontSize: '10px', fontWeight: '700',
					letterSpacing: '0.08em', textTransform: 'uppercase',
					color: 'rgba(255,255,255,0.3)', padding: '4px 2px 0',
				},
				row: {
					display: 'flex', justifyContent: 'space-between', alignItems: 'center',
					padding: '8px 10px',
					background: 'rgba(255,255,255,0.05)',
					borderRadius: '7px', gap: '12px',
				},
				labelGroup: {
					display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0,
				},
				label: { fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
				desc:  { fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
				textInput: {
					width: '130px',
					background: 'rgba(255,255,255,0.1)',
					border: '1px solid rgba(255,255,255,0.15)',
					borderRadius: '6px',
					color: '#fff',
					fontSize: '13px',
					fontWeight: '600',
					textAlign: 'left',
					padding: '4px 8px',
					outline: 'none',
					flexShrink: 0,
					userSelect: 'text',
				},
				numberInput: {
					width: '72px',
					background: 'rgba(255,255,255,0.1)',
					border: '1px solid rgba(255,255,255,0.15)',
					borderRadius: '6px',
					color: '#fff',
					fontSize: '13px',
					fontWeight: '600',
					textAlign: 'center',
					padding: '4px 6px',
					outline: 'none',
					flexShrink: 0,
					userSelect: 'text',
				},
				saveBtn: {
					width: '100%',
					padding: '8px',
					borderRadius: '7px',
					border: 'none',
					background: saved ? 'rgba(29,185,84,0.25)' : 'rgba(255,255,255,0.1)',
					color: saved ? '#1db954' : 'rgba(255,255,255,0.7)',
					fontSize: '13px',
					fontWeight: '700',
					cursor: 'pointer',
					transition: 'background 0.2s, color 0.2s',
					letterSpacing: '0.03em',
				},
				divider: {
					height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 0',
				},
				statusDot: {
					width: '8px', height: '8px', borderRadius: '50%',
					background: '#1db954', flexShrink: 0, marginRight: '4px',
					display: 'inline-block',
				},
				statusRow: {
					display: 'flex', alignItems: 'center', gap: '6px',
					padding: '6px 10px',
					background: 'rgba(255,255,255,0.03)',
					borderRadius: '7px',
					fontSize: '11px',
					color: 'rgba(255,255,255,0.35)',
				},
			};

			const currentEndpoint = `http://${getSetting(KEYS.host, CONFIG.defaultHost)}:${getSetting(KEYS.port, CONFIG.defaultPort)}/poll`;

			return React.createElement('div', { style: styles.panel },

				// Header / drag handle
				React.createElement('div', { style: styles.header, onMouseDown },
					React.createElement('span', { style: styles.title }, '🎵 Queue Receiver'),
					React.createElement('button', {
						style: styles.closeBtn, onClick: onClose,
						onMouseEnter: e => e.target.style.color = 'rgba(255,255,255,0.9)',
						onMouseLeave: e => e.target.style.color = 'rgba(255,255,255,0.4)',
					}, '✕')
				),

				React.createElement('div', { style: styles.body },

					// ---- Section: Server ----
					React.createElement('span', { style: styles.sectionLabel }, 'Server'),

					React.createElement('div', { style: styles.row },
						React.createElement('div', { style: styles.labelGroup },
							React.createElement('span', { style: styles.label }, 'Host / IP'),
							React.createElement('span', { style: styles.desc  }, 'Address of the queue server'),
						),
						React.createElement('input', {
							type: 'text',
							value: host,
							onChange: handleHost,
							style: styles.textInput,
							placeholder: '127.0.0.1',
							spellCheck: false,
							title: 'Server host or IP address',
						})
					),

					React.createElement('div', { style: styles.row },
						React.createElement('div', { style: styles.labelGroup },
							React.createElement('span', { style: styles.label }, 'Port'),
							React.createElement('span', { style: styles.desc  }, 'Port the server is listening on (1–65535)'),
						),
						React.createElement('input', {
							type: 'number',
							value: port,
							min: 1, max: 65535,
							onChange: handlePort,
							style: styles.numberInput,
							title: 'Server port number',
						})
					),

					React.createElement('div', { style: styles.divider }),

					// ---- Status ----
					React.createElement('div', { style: styles.statusRow },
						React.createElement('span', { style: styles.statusDot }),
						React.createElement('span', null, `Polling: ${currentEndpoint}`)
					),

					// ---- Save button ----
					React.createElement('button', {
						style: styles.saveBtn,
						onClick: handleSave,
						onMouseEnter: e => { if (!saved) e.target.style.background = 'rgba(255,255,255,0.16)'; },
						onMouseLeave: e => { if (!saved) e.target.style.background = 'rgba(255,255,255,0.1)'; },
					}, saved ? '✓ Saved' : 'Save & Apply')
				)
			);
		};

		// =========================
		// Panel mount / unmount
		// =========================
		let panelContainer = null;

		const openPanel = (anchorRect) => {
			if (panelContainer) {
				closePanel();
				return;
			}
			log.info('Opening settings panel.');
			panelContainer = document.createElement('div');
			panelContainer.id = 'queue-receiver-settings-panel';
			document.body.appendChild(panelContainer);
			ReactDOM.render(
				React.createElement(SettingsPanel, { onClose: closePanel, anchorRect }),
				panelContainer
			);
		};

		const closePanel = () => {
			if (!panelContainer) return;
			log.info('Closing settings panel.');
			ReactDOM.unmountComponentAtNode(panelContainer);
			panelContainer.remove();
			panelContainer = null;
		};

		// =========================
		// Topbar button injection
		// =========================
		const injectTopbarButton = () => {
			if (document.getElementById('queue-receiver-settings-btn')) return;

			const targetBar = document.querySelector('.main-topBar-topbarContentRight');
			if (!targetBar) return;

			const btn = document.createElement('button');
			btn.id = 'queue-receiver-settings-btn';
			btn.setAttribute('aria-label', 'Queue Receiver Settings');
			btn.style.cssText = 'background: none; border: none; padding: 0; margin: 0; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-base, #fff); position: relative;';
			// Queue / add-to-playlist icon
			btn.innerHTML = `<svg style="pointer-events:none;" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
				<path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm9 .5v-2.5a.5.5 0 0 1 1 0V11h2.5a.5.5 0 0 1 0 1H12v2.5a.5.5 0 0 1-1 0V12H8.5a.5.5 0 0 1 0-1H11z"/>
			</svg>`;
			btn.addEventListener('click', () => openPanel(btn.getBoundingClientRect()));

			targetBar.insertBefore(btn, targetBar.firstChild);
			log.info('Topbar button injected.');
		};

		// =========================
		// Polling logic
		// Reads host/port from localStorage on every tick so settings
		// changes take effect immediately after saving without a reload.
		// =========================
		async function poll() {
			const host = getSetting(KEYS.host, CONFIG.defaultHost);
			const port = getSetting(KEYS.port, CONFIG.defaultPort);
			try {
				const res  = await fetch(`http://${host}:${port}/poll`);
				const data = await res.json();
				if (!data.track) return;
				await Spicetify.addToQueue([{ uri: data.track }]);
				Spicetify.showNotification('Added to queue');
				log.info('Track queued:', data.track);
			} catch (e) {
				// Silently ignore connection refused — server just isn't running
				if (!e?.message?.includes('Failed to fetch') && !e?.message?.includes('ERR_CONNECTION_REFUSED')) {
					log.error('Poll failed:', e);
				}
			}
		}

		// =========================
		// Main
		// =========================
		async function main() {
			log.info('Waiting for Spicetify.showNotification...');
			while (!Spicetify?.showNotification) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			log.info('Spicetify ready. Waiting for topbar element...');

			// Wait until the topbar container actually exists in the DOM
			// before attempting injection - this is the root cause of the
			// button not appearing on first load.
			while (!document.querySelector('.main-topBar-topbarContentRight')) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			log.info('Topbar element found. Initializing addon.');

			// Topbar button style
			const style = document.createElement('style');
			style.textContent = `
				#queue-receiver-settings-btn { opacity: 0.7; transition: opacity 0.15s; cursor: pointer !important; width: 28px; height: 28px; }
				#queue-receiver-settings-btn * { pointer-events: none; }
				#queue-receiver-settings-btn:hover { opacity: 1; }
			`;
			document.head.appendChild(style);

			// Inject now that we know the element exists, and re-inject
			// via MutationObserver in case Spotify re-renders the topbar.
			injectTopbarButton();
			new MutationObserver(() => injectTopbarButton())
				.observe(document.body, { childList: true, subtree: true });

			// Start polling
			setInterval(poll, CONFIG.pollInterval);
			log.info('Polling started every ' + CONFIG.pollInterval + 'ms.');
		}

		main().catch(e => log.error('main() crashed:', e));
	})();
})();
