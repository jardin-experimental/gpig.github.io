const GELATO_API_URL = 'https://order.gelatoapis.com/v4/orders'

type GelatoOrderItem = {
    itemReferenceId: string
    productUid: string
    quantity: number
    fileUrl: string
}

type GelatoShippingAddress = {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    postCode: string
    country: string
    email: string
}

export async function createGelatoOrder({
    orderReferenceId,
    customerReferenceId,
    currency,
    items,
    shippingAddress,
}: {
    orderReferenceId: string
    customerReferenceId: string
    currency: string
    items: GelatoOrderItem[]
    shippingAddress: GelatoShippingAddress
}) {
    const response = await fetch(GELATO_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.GELATO_API_KEY!,
        },
        body: JSON.stringify({
            orderType: 'order',
            orderReferenceId,
            customerReferenceId,
            currency,
            items: items.map((item) => ({
                itemReferenceId: item.itemReferenceId,
                productUid: item.productUid,
                quantity: item.quantity,
                files: [{ type: 'default', url: item.fileUrl }],
            })),
            shippingAddress,
        }),
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Gelato ${response.status}: ${errorBody}`)
    }

    return response.json() as Promise<{ id: string; status: string }>
}