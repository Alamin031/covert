# Shared Storage System - Region Default Storages

## 🎯 Overview

এই system এ region level এ default storages define করা যায় যা সব colors automatically inherit করবে। শুধুমাত্র যে colors এর আলাদা pricing দরকার, সেগুলোর জন্য custom storage add করতে হবে।

## ✨ Key Benefits

### Before (Old System)
```
Region: International
  └─ Colors:
      ├─ Natural Titanium
      │   ├─ 128GB - ৳89,999 (manual entry)
      │   ├─ 256GB - ৳99,999 (manual entry)
      │   └─ 512GB - ৳119,999 (manual entry)
      ├─ Blue Titanium
      │   ├─ 128GB - ৳89,999 (manual entry - DUPLICATE!)
      │   ├─ 256GB - ৳99,999 (manual entry - DUPLICATE!)
      │   └─ 512GB - ৳119,999 (manual entry - DUPLICATE!)
      └─ White Titanium
          ├─ 128GB - ৳89,999 (manual entry - DUPLICATE!)
          ├─ 256GB - ৳99,999 (manual entry - DUPLICATE!)
          └─ 512GB - ৳119,999 (manual entry - DUPLICATE!)
```
**Problem:** 3 colors × 3 storages = 9 entries (lots of duplication!)

### After (New System)
```
Region: International
  ├─ Default Storages (once only!):
  │   ├─ 128GB - ৳89,999
  │   ├─ 256GB - ৳99,999
  │   └─ 512GB - ৳119,999
  │
  └─ Colors (inherit default storages):
      ├─ Natural Titanium (uses default)
      ├─ Blue Titanium (uses default)
      ├─ White Titanium (uses default)
      └─ Gold Titanium (custom pricing)
          ├─ 128GB - ৳92,999 (premium!)
          └─ 256GB - ৳102,999 (premium!)
```
**Benefit:** শুধু 1 বার default storages define করলেই হয়!

## 📋 Database Schema Changes

### ProductRegion Entity
```typescript
@Entity('product_regions')
export class ProductRegion {
  // ... existing fields ...
  
  @OneToMany(() => ProductStorage, (storage) => storage.region, { cascade: true })
  defaultStorages: ProductStorage[]; // NEW: Shared storages for all colors
}
```

### ProductColor Entity
```typescript
@Entity('product_colors')
export class ProductColor {
  // ... existing fields ...
  
  @Column({ default: true })
  useDefaultStorages: boolean; // NEW: true = use region defaults, false = custom
}
```

### ProductStorage Entity
```typescript
@Entity('product_storages')
export class ProductStorage {
  @Column({ nullable: true })
  colorId?: UUID string; // Null if this is a region default storage
  
  @Column({ nullable: true })
  regionId?: UUID string; // NEW: For region-level default storages
  
  @ManyToOne(() => ProductRegion, (region) => region.defaultStorages, { nullable: true })
  region?: ProductRegion; // NEW: Link to region
}
```

## 🔧 API Request Structure

### Creating Product with Shared Storages

```json
{
  "name": "iPhone 15 Pro Max",
  "slug": "iphone-15-pro-max",
  "regions": [
    {
      "regionName": "International",
      "isDefault": true,
      
      "defaultStorages": [
        {
          "storageSize": "128GB",
          "displayOrder": 1,
          "price": {
            "regularPrice": 89999,
            "comparePrice": 95999,
            "stockQuantity": 50,
            "lowStockAlert": 5
          }
        },
        {
          "storageSize": "256GB",
          "displayOrder": 2,
          "price": {
            "regularPrice": 99999,
            "comparePrice": 105999,
            "stockQuantity": 40,
            "lowStockAlert": 5
          }
        },
        {
          "storageSize": "512GB",
          "displayOrder": 3,
          "price": {
            "regularPrice": 119999,
            "comparePrice": 125999,
            "stockQuantity": 30,
            "lowStockAlert": 5
          }
        }
      ],
      
      "colors": [
        {
          "colorName": "Natural Titanium",
          "colorImage": "https://cdn.example.com/natural.jpg",
          "useDefaultStorages": true,
          "displayOrder": 1
        },
        {
          "colorName": "Blue Titanium",
          "colorImage": "https://cdn.example.com/blue.jpg",
          "useDefaultStorages": true,
          "displayOrder": 2
        },
        {
          "colorName": "White Titanium",
          "colorImage": "https://cdn.example.com/white.jpg",
          "useDefaultStorages": true,
          "displayOrder": 3
        },
        {
          "colorName": "Gold Titanium",
          "colorImage": "https://cdn.example.com/gold.jpg",
          "useDefaultStorages": false,
          "displayOrder": 4,
          "storages": [
            {
              "storageSize": "128GB",
              "displayOrder": 1,
              "price": {
                "regularPrice": 92999,
                "comparePrice": 98999,
                "stockQuantity": 20,
                "lowStockAlert": 3
              }
            },
            {
              "storageSize": "256GB",
              "displayOrder": 2,
              "price": {
                "regularPrice": 102999,
                "comparePrice": 108999,
                "stockQuantity": 15,
                "lowStockAlert": 3
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 📤 API Response Structure

```json
{
  "id": "...",
  "name": "iPhone 15 Pro Max",
  "regions": [
    {
      "id": "...",
      "name": "International",
      "isDefault": true,
      
      "defaultStorages": [
        {
          "id": "...",
          "size": "128GB",
          "price": {
            "regular": 89999,
            "compare": 95999,
            "final": 89999
          },
          "stock": 50,
          "inStock": true
        },
        {
          "id": "...",
          "size": "256GB",
          "price": {
            "regular": 99999,
            "compare": 105999,
            "final": 99999
          },
          "stock": 40,
          "inStock": true
        }
      ],
      
      "colors": [
        {
          "id": "...",
          "name": "Natural Titanium",
          "image": "https://cdn.example.com/natural.jpg",
          "useDefaultStorages": true,
          "customStorages": null
        },
        {
          "id": "...",
          "name": "Blue Titanium",
          "image": "https://cdn.example.com/blue.jpg",
          "useDefaultStorages": true,
          "customStorages": null
        },
        {
          "id": "...",
          "name": "Gold Titanium",
          "image": "https://cdn.example.com/gold.jpg",
          "useDefaultStorages": false,
          "customStorages": [
            {
              "id": "...",
              "size": "128GB",
              "price": {
                "regular": 92999,
                "compare": 98999,
                "final": 92999
              },
              "stock": 20,
              "inStock": true
            }
          ]
        }
      ]
    }
  ]
}
```

## 🎨 Frontend Logic

```typescript
// Display storages for a color
function getColorStorages(region, color) {
  if (color.useDefaultStorages) {
    // Use region's default storages
    return region.defaultStorages;
  } else {
    // Use color's custom storages
    return color.customStorages;
  }
}

// Example usage:
const region = product.regions[0];
const color = region.colors[0]; // Natural Titanium

if (color.useDefaultStorages) {
  // Display: 128GB (৳89,999), 256GB (৳99,999), 512GB (৳119,999)
  region.defaultStorages.forEach(storage => {
    console.log(`${storage.size} - ৳${storage.price.regular}`);
  });
} else {
  // Display custom storages
  color.customStorages.forEach(storage => {
    console.log(`${storage.size} - ৳${storage.price.regular}`);
  });
}
```

## ✅ Use Cases

### Use Case 1: Same Price for All Colors
**Example:** Standard iPhone models (all colors same price)

```json
{
  "regionName": "International",
  "defaultStorages": [/* 128GB, 256GB, 512GB */],
  "colors": [
    {"colorName": "Black", "useDefaultStorages": true},
    {"colorName": "White", "useDefaultStorages": true},
    {"colorName": "Blue", "useDefaultStorages": true}
  ]
}
```

### Use Case 2: Premium Color with Different Pricing
**Example:** Gold/Special Edition (higher price)

```json
{
  "regionName": "International",
  "defaultStorages": [/* standard pricing */],
  "colors": [
    {"colorName": "Black", "useDefaultStorages": true},
    {
      "colorName": "Gold Edition",
      "useDefaultStorages": false,
      "storages": [/* premium pricing */]
    }
  ]
}
```

### Use Case 3: Limited Storage for Specific Color
**Example:** Budget color only in 64GB and 128GB

```json
{
  "regionName": "International",
  "defaultStorages": [/* 128GB, 256GB, 512GB, 1TB */],
  "colors": [
    {"colorName": "Premium Black", "useDefaultStorages": true},
    {
      "colorName": "Budget Blue",
      "useDefaultStorages": false,
      "storages": [/* only 64GB, 128GB */]
    }
  ]
}
```

## 🚀 Migration from Old System

If you have existing products with the old structure, you can migrate them:

1. Group all identical storages across colors
2. Move them to `defaultStorages` in the region
3. Set `useDefaultStorages: true` for all colors using these defaults
4. Keep only custom storages with `useDefaultStorages: false`

## 📊 Data Savings Example

### iPhone 15 Pro Max (4 colors, 4 storages each)

**Old System:**
- 4 colors × 4 storages = 16 storage entries
- 16 price entries

**New System:**
- 4 default storages (once)
- 4 color entries (no storage duplication)
- 4 price entries

**Savings:** 75% less data entry! 🎉

---

**Note:** This system is backward compatible. Products without `defaultStorages` will work as before with color-level storages.
