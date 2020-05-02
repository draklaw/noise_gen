export const waveTables = {
	'sine': null,
	'saw': null,
	'triangle': null,
	'square': null,
	'warm_saw': null,
	'warm_triangle': null,
	'warm_square': null,
	'dropped_saw': null,
	'dropped_square': null,
	'tb303_square': null,
}


export async function loadTable(name) {
	try {
		const response = await fetch(`wave_tables/${name}`)
		const table = await response.json()

		waveTables[table] = table
		return table
	}
	catch(err) {
		console.error(`Failed to load table '${name}':`, err)
	}

	return null
}
