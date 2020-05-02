

export function clamp(value, min, max) {
	if(value < min)
		return min
	if(value > max)
		return max
	return value
}


export function linearFromDecibel(decibel) {
	return Math.pow(10, decibel / 20)
}


export function isString(obj) {
	return (typeof obj === "string") || (obj instanceof String);
}


export function el(tag, attrs={}, ...children) {
	const elem = document.createElement(tag);

	for(const [k, v] of Object.entries(attrs)) {
		elem.setAttribute(k, v);
	}

	for(let child of children) {
		if(isString(child)) {
			child = document.createTextNode(child);
		}

		elem.appendChild(child);
	}

	return elem;
}
