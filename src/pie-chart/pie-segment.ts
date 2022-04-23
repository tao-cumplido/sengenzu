import { css, html, LitElement, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface UpdateArcParameters {
	readonly index: number;
	readonly position: number;
	readonly total: number;
}

interface MaskSegment {
	readonly path: string;
	readonly delay: number;
}

function calculateArcPoint(fraction: number) {
	const n = 2 * Math.PI * fraction;
	return {
		x: Math.cos(n),
		y: Math.sin(n),
	};
}

const start = calculateArcPoint(0);

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
	private maskSegments: MaskSegment[] = [];

	private animationStartLine = '';
	private slicePath = '';

	@property({ type: Number })
	value = 0;

	updateArc({ position, total }: UpdateArcParameters) {
		[...(this.style as unknown as Iterable<string>)]
			.filter((value) => value.startsWith('--mask-'))
			.forEach((value) => this.style.setProperty(value, null));

		const factor = this.value / total;
		const rotation = position / total;
		const end = calculateArcPoint(factor);
		const largeArcFlag = factor > 0.5 ? 1 : 0;

		this.animationStartLine = `M ${start.x} ${start.y} L 0 0`;
		this.slicePath = `M ${start.x} ${start.y} A 1 1 0 ${largeArcFlag} 1 ${end.x} ${end.y} L 0 0 z`;

		if (largeArcFlag) {
			const segmentCount = Math.ceil((2 * factor) / (1 - factor));
			const segmentCountFactor = factor / segmentCount;

			this.maskSegments = Array.from({ length: segmentCount }).map((_, index) => {
				const segmentFactor = (index + 1) * segmentCountFactor;
				const segmentEnd = calculateArcPoint(segmentFactor);

				return {
					path: `M ${start.x} ${start.y} A 1 1 0 ${segmentFactor > 0.5 ? 1 : 0} 1 ${segmentEnd.x} ${segmentEnd.y} L 0 0 z`,
					delay: index * segmentCountFactor + rotation,
				};
			});
		} else {
			this.maskSegments = [
				{
					path: this.slicePath,
					delay: rotation,
				},
			];
		}

		this.style.setProperty('--rotation', `${rotation}turn`);

		this.style.setProperty('--slice-rotation', `-${factor}turn`);
		this.style.setProperty('--transition-rotation', 'none');
		this.style.setProperty('--opacity', '0');
		this.style.setProperty('--transition-opacity', 'none');

		for (const index in this.maskSegments) {
			this.style.setProperty(`--mask-${index}-opacity`, '0');
			this.style.setProperty(`--mask-${index}-transition-opacity`, 'none');
		}

		this.getBoundingClientRect();

		this.style.setProperty('--slice-rotation', '0');
		this.style.setProperty(
			'--transition-rotation',
			`transform calc(${factor} * var(--animation-duration, 0s)) linear calc(${rotation} * var(--animation-duration, 0s))`,
		);
		this.style.setProperty('--opacity', '1');
		this.style.setProperty('--transition-opacity', `opacity 0s linear calc(${rotation} * var(--animation-duration, 0s))`);
	}

	override updated(changes: Map<string, unknown>) {
		if (changes.get('value')) {
			this.dispatchEvent(new Event('pie-change', { bubbles: true }));
		}

		if (changes.get('maskSegments')) {
			this.getBoundingClientRect();

			for (const [index, maskSegment] of this.maskSegments.entries()) {
				this.style.setProperty(`--mask-${index}-opacity`, '1');
				this.style.setProperty(
					`--mask-${index}-transition-opacity`,
					`opacity 0s linear calc((${maskSegment.delay}) * var(--animation-duration, 0s))`,
				);
			}
		}
	}

	override render() {
		return html`
			<svg viewBox="-1 -1 2 2">
				<defs>
					<mask id="mask">
						${this.maskSegments.map(
							({ path }, index) => svg`
							<path class="stroke" style=${styleMap({
								opacity: `var(--mask-${index}-opacity)`,
								transition: `var(--mask-${index}-transition-opacity)`,
							})} d=${path} fill="white"></path>
						`,
						)}
						<circle class="donut-hole" fill="black" />
					</mask>
				</defs>
				<g mask="url(#mask)">
					<path class="stroke slice" d=${this.slicePath} />
					<path class="stroke" d=${this.animationStartLine} />
				</g>
				<circle class="donut-hole stroke" fill="none" />
			</svg>
		`;
	}
}
