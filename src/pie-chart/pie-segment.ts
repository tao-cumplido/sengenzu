import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface UpdateArcParameters {
	// readonly index: number;
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
			transform: rotate(-0.25turn);
		}

		path {
			fill: var(--color);
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
	private pathDefinition = '';

	@state()
	private turnFactor = 0;

	@property({ type: Number })
	value = 0;

	updateArc({ position, total }: UpdateArcParameters) {
		const factor = this.value / total;
		const end = calculateArcPoint(factor + ε);
		const largeArcFlag = factor > 0.5 ? 1 : 0;
		this.pathDefinition = `M ${start.x} ${start.y} A 1 1 0 ${largeArcFlag} 1 ${end.x} ${end.y} L 0 0 z`;
		this.turnFactor = position / total;
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
						<circle class="stroke" cx="0" cy="0" r="1" fill="white" />
						<circle class="donut-hole" cx="0" cy="0" fill="black" />
					<mask>
				</defs>
				<path
					class="stroke"
					style=${styleMap({ transform: `rotate(${this.turnFactor}turn)` })}
					mask="url(#donut)"
					d=${this.pathDefinition}
				/>
				<circle class="donut-hole stroke" cx="0" cy="0" fill="none" />
			</svg>
		`;
	}
}
