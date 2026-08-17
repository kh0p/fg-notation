/**
 * Inline SVG glyphs for directional inputs.
 *
 * These are drawn locally rather than fetched from a wiki or combo site so the
 * plugin works offline, in exported PDFs, and without hotlinking anyone's
 * assets.
 */

const NS = "http://www.w3.org/2000/svg";

/** Rotation (degrees) for each numpad direction, 0 = pointing right. */
const ANGLE: Record<string, number> = {
	"6": 0,
	"9": -45,
	"8": -90,
	"7": -135,
	"4": 180,
	"1": 135,
	"2": 90,
	"3": 45,
};

/** A chunky right-pointing arrow in a 24×24 box. */
const ARROW_PATH = "M2 9.5h9.5V5.5L21 12l-9.5 6.5v-4H2z";

function svgRoot(cls: string): SVGSVGElement {
	const svg = document.createElementNS(NS, "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("class", cls);
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("focusable", "false");
	return svg;
}

/** Arrow for one of the eight numpad directions, or a dot for neutral (5). */
export function directionIcon(dir: string): SVGSVGElement | null {
	if (dir === "5") {
		const svg = svgRoot("fgn-icon fgn-icon--neutral");
		const c = document.createElementNS(NS, "circle");
		c.setAttribute("cx", "12");
		c.setAttribute("cy", "12");
		c.setAttribute("r", "4.5");
		svg.appendChild(c);
		return svg;
	}

	const angle = ANGLE[dir];
	if (angle === undefined) return null;

	const svg = svgRoot("fgn-icon fgn-icon--dir");
	const p = document.createElementNS(NS, "path");
	p.setAttribute("d", ARROW_PATH);
	if (angle !== 0) p.setAttribute("transform", `rotate(${angle} 12 12)`);
	svg.appendChild(p);
	return svg;
}

/** Circular arrow used for 360 / 720 grab motions. */
export function spinIcon(double: boolean): SVGSVGElement {
	const svg = svgRoot("fgn-icon fgn-icon--spin");

	const arc = document.createElementNS(NS, "path");
	arc.setAttribute("d", "M20 12a8 8 0 1 1-2.34-5.66");
	arc.setAttribute("fill", "none");
	arc.setAttribute("stroke", "currentColor");
	arc.setAttribute("stroke-width", "2.6");
	arc.setAttribute("stroke-linecap", "round");
	svg.appendChild(arc);

	const head = document.createElementNS(NS, "path");
	head.setAttribute("d", "M12.5 3.5h6v6z");
	svg.appendChild(head);

	if (double) {
		const inner = document.createElementNS(NS, "circle");
		inner.setAttribute("cx", "12");
		inner.setAttribute("cy", "12");
		inner.setAttribute("r", "3");
		inner.setAttribute("fill", "none");
		inner.setAttribute("stroke", "currentColor");
		inner.setAttribute("stroke-width", "2");
		svg.appendChild(inner);
	}
	return svg;
}

/** Charge marker — a bar suggesting "hold this direction". */
export function chargeIcon(): SVGSVGElement {
	const svg = svgRoot("fgn-icon fgn-icon--charge");
	const r = document.createElementNS(NS, "rect");
	r.setAttribute("x", "3");
	r.setAttribute("y", "9");
	r.setAttribute("width", "13");
	r.setAttribute("height", "6");
	r.setAttribute("rx", "3");
	svg.appendChild(r);
	return svg;
}
