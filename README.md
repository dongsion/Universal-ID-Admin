# Universal ID - Merchant Dashboard

Merchant admin panel for the Universal ID snacks store.

## Features

### Dashboard
- Total products, stock value, order count, revenue stats
- Low stock alerts with one-click restock
- Recent orders overview

### Product Management
- Table view with inline stock adjustment (+/-)
- Add/edit/delete products with image upload
- Category, price, stock, and card color management
- Status badges (In Stock / Low Stock / Out of Stock)

### Order Management
- Filter by status (All / Pending / Completed / Cancelled)
- Order detail modal with item breakdown
- Mark orders complete or cancelled
- Auto-syncs with customer app every 5 seconds

### Real-time Chat (New)
- **Customer Messages** - Dedicated "消息" tab in sidebar for managing customer conversations
- **Conversation List** - Left panel shows all customer conversations with unread badges
- **Chat Window** - Right panel displays selected conversation with message bubbles
- **Real-time Messaging** - WebSocket-powered instant message delivery
- **Unread Notifications** - Red badge on nav item shows total unread messages
- **Quick Reply** - Type and send replies directly from the chat window

## Data Sync
Shares localStorage with the customer app (`Universal-ID` repo). Both apps must be deployed under the same domain (e.g. `*.github.io`) for data to sync.

## Related
- Customer app: [Universal-ID](https://github.com/dongsion/Universal-ID)

## License
MIT
