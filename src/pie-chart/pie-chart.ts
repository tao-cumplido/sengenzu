import { html, LitElement, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ZuPieSegment } from './pie-segment';

@customElement('zu-pie-chart')
export class ZuPieChart extends LitElement {
	static override readonly styles = css`
		:host {
			display: grid;
			grid: 'chart' auto / auto;
		}
	`;

	private segments: ZuPieSegment[] = [];

	private updatePie() {
		const total = this.segments.reduce((result, { value }) => result + value, 0);

		let position = 0;

		for (const segment of this.segments) {
			segment.updateArc({ total, position });
			position += segment.value;
		}
	}

	constructor() {
		super();
		this.addEventListener('pie-change', (event) => {
			event.stopPropagation();
			this.updatePie();
		});
	}

	override render() {
		return html`
			<slot
				@slotchange=${(event: Event & { currentTarget: HTMLSlotElement }) => {
					this.segments = event.currentTarget
						.assignedElements()
						.filter((element): element is ZuPieSegment => element instanceof ZuPieSegment);

					this.updatePie();
				}}
			></slot>
		`;
	}
}
