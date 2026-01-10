"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Mock data - in real app would come from useAuth().user.portfolio.bonds
const bonds = [
    {
        value: "us-treasury",
        label: "US Treasury Bill – 365 Days",
    },
    {
        value: "us-treasury-2",
        label: "US Treasury Note – 2 Year",
    },
]

export function MyBondsDropdown() {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const router = useRouter()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-center gap-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:text-primary text-primary/80"
                >
                    <Wallet className="h-4 w-4" />
                    <span className="truncate">
                        {value
                            ? bonds.find((bond) => bond.value === value)?.label
                            : "My Bonds"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 bg-[#0A0A0A] border-gray-800">
                <Command className="bg-[#0A0A0A]">
                    <CommandInput placeholder="Select bond..." className="text-white bg-transparent" />
                    <CommandList>
                        <CommandEmpty className="py-2 text-sm text-center text-gray-500">No bond found.</CommandEmpty>
                        <CommandGroup>
                            {bonds.map((bond) => (
                                <CommandItem
                                    key={bond.value}
                                    value={bond.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                        router.push(`/portfolio/${bond.value}`) // Use bond.value to ensure correct ID is passed
                                    }}
                                    className="text-white hover:bg-gray-800 cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === bond.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {bond.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
