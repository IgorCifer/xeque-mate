import prisma from "@/lib/prisma"

export const getUserPoints = async (userId: string) => {
    const points = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            points: true
        }
    })

    return points;
}