export const PACKS = {
    PACK_5: {
        amount: 3500,
        credits: 5,
        name: '5회권',
    },
    PACK_10: {
        amount: 6500,
        credits: 10,
        name: '10회권',
    },
} as const;

export type PackType = keyof typeof PACKS;

export function getPackDetails(packType: string) {
    return PACKS[packType as PackType];
}
