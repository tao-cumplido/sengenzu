import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface UpdateArcParameters {
	readonly index: number;
	readonly position: number;
	readonly total: number;
}

function calculateArcPoint(fraction: number) {
	const n = 2 * Math.PI * fraction;
	return {
		x: Math.cos(n),
		y: Math.sin(n),
	};
}

// minimally overlap segments to prevent antialiasing seams
const ε = 0.0001;

const start = calculateArcPoint(-ε);

@customElement('zu-pie-segment')
export class ZuPieSegment extends LitElement {
	static override readonly styles = css`
		:host {
			grid-area: chart;
		}

		svg {
			overflow: visible;
			transform: rotate(calc(var(--rotation, 0) - 0.25turn));
		}

		g {
			opacity: var(--opacity);
			transition: var(--transition-opacity);
		}

		.slice {
			fill: var(--color);
			transform: rotate(var(--slice-rotation));
			transition: var(--transition-rotation);
		}

		.stroke {
			vector-effect: non-scaling-stroke;
			stroke: var(--stroke);
			stroke-width: var(--stroke-width, 100%);
			stroke-linejoin: round;
		}

		.donut-hole {
			r: var(--donut-size, 0);
		}

		mask .stroke {
			stroke: white;
		}
	`;

	@state()
	private startLine = '';

	@state()
	private pathDefinition = '';

	@property({ type: Number })
	value = 0;

	updateArc({ position, total }: UpdateArcParameters) {
		const factor = this.value / total;
		const rotation = position / total;
		const end = calculateArcPoint(factor + ε);
		const largeArcFlag = factor > 0.5 ? 1 : 0;
		this.startLine = `M ${start.x} ${start.y} L 0 0`;
		this.pathDefinition = `M ${start.x} ${start.y} A 1 1 0 ${largeArcFlag} 1 ${end.x} ${end.y} L 0 0 z`;
		this.style.setProperty('--rotation', `${rotation}turn`);

		this.style.setProperty('--slice-rotation', `-${factor}turn`);
		this.style.setProperty('--transition-rotation', 'none');
		this.style.setProperty('--opacity', '0');
		this.style.setProperty('--transition-opacity', 'none');

		this.getBoundingClientRect();

		this.style.setProperty('--slice-rotation', '0');
		this.style.setProperty('--transition-rotation', `transform ${factor}s linear ${rotation}s`);
		this.style.setProperty('--opacity', '1');
		this.style.setProperty('--transition-opacity', `opacity 0s linear ${rotation}s`);
	}

	override updated(changes: Map<string, unknown>) {
		if (changes.has('value')) {
			this.dispatchEvent(new Event('pie-change', { bubbles: true }));
		}
	}

	override render() {
		return html`
			<svg viewBox="-1 -1 2 2">
				<defs>
					<mask id="donut">
						<path class="stroke" d=${this.pathDefinition} fill="white" />
						<circle class="donut-hole" fill="black" />
					</mask>
				</defs>
				<g mask="url(#donut)">
					<path class="stroke slice" d=${this.pathDefinition} />
					<path class="stroke" d=${this.startLine} />
				</g>
				<circle class="donut-hole stroke" fill="none" />
			</svg>
		`;
	}
}
