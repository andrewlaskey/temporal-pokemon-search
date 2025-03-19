export interface Pokemon {
    id: number;
    name: string;
    classification: string;
}

export interface SearchResults {
    pokemon: Pokemon[];
    nextPage?: string;
}

export interface ErrorResponse {
    error: string;
}

export class PokemonApi {
    private baseUrl = '/api/api/pokemon';
    private headers: Record<string, string>;
    public hasChaosEnabled = false;

    constructor() {
        this.headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
    }

    async request<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T | undefined> {
        let urlString = this.baseUrl + endpoint;

        const queryParams = Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');

        if (queryParams) {
            urlString += `?${queryParams}`;
        }

        if (this.hasChaosEnabled) {
            urlString += (urlString.includes('?') ? '&' : '?') + 'chaos=true';
        }

        const response = await fetch(urlString, {
            method: 'GET',
            headers: this.headers,
        });

        if (response.status === 404) {
            return undefined;
        }

        if (response.status === 500) {
            const { error } = await response.json() as ErrorResponse;

            throw new Error(error);
        }

        if (!response.ok) {
            throw new Error('Unhandled error');
        }

        return response.json() as Promise<T>;
    }

    async search(searchStr: string): Promise<Pokemon[]> {
        const pokemon = [];
        let hasNextPage = false;
        let nextPage: string | undefined;

        do {
            const params: Record<string, unknown> = {};

            if (hasNextPage) {
                params.page = nextPage;
            }

            const results = await this.request<SearchResults>(`/search/${searchStr}`, params);

            if (results) {
                console.log(results);
                pokemon.push(...results.pokemon);

                if (results.nextPage) {
                    nextPage = results.nextPage;
                    hasNextPage = true;
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }

        } while (hasNextPage)

        return pokemon;
    }
}