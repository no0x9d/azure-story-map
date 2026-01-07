import Papa from 'papaparse';

export async function extractIdsFromCSV({
	fileContent,
	idColumn
}: {
	fileContent: string;
	idColumn: string;
}): Promise<number[]> {
	const parseResult = Papa.parse<{ ID: number }>(fileContent, {
		header: true,
		skipEmptyLines: true
	});

	if (parseResult.errors.length > 0) {
		throw new Error(
			`Error parsing CSV: ${parseResult.errors
				.map((e) => e.message + ` (row ${e.row}, column ${e.index})`)
				.join(', ')}`
		);
	}
	const idColumnIndex = parseResult.meta.fields!.findIndex((field) => field === idColumn);

	return parseResult.data.map((row: { ID: number }) => row['ID']);
}
