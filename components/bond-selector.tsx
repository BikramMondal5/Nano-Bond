"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"

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

export interface BondOption {
    bondId: string;
    bondName: string;
    description?: string;
}

interface BondSelectorProps {
    bonds: BondOption[];
    selectedBondId: string;
    onSelect: (bondId: string) => void;
    loading?: boolean;
}

export function BondSelector({ bonds, selectedBondId, onSelect, loading }: BondSelectorProps) {
    const [open, setOpen] = React.useState(false)

    // Find the currently selected bond object
    const selectedBond = bonds.find(b => b.bondId === selectedBondId)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={loading}
                    className="w-[280px] justify-between border-primary/20 bg-[#1C1A21] hover:bg-[#1C1A21]/80 text-white hover:text-white"
                >
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">
                            {loading ? "Loading bonds..." : (selectedBond ? selectedBond.bondName : "Select Bond")}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-[#100F14] border-primary/20 shadow-xl">
                <Command className="bg-[#100F14]">
                    <CommandInput placeholder="Search bonds..." className="text-white bg-transparent border-none focus:ring-0" />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            No bonds found.
                        </CommandEmpty>
                        <CommandGroup heading="Available Bonds" className="text-muted-foreground">
                            {bonds.map((bond) => (
                                <CommandItem
                                    key={bond.bondId}
                                    value={bond.bondName}
                                    onSelect={() => {
                                        onSelect(bond.bondId)
                                        setOpen(false)
                                    }}
                                    className="text-white hover:bg-primary/10 cursor-pointer aria-selected:bg-primary/10 py-3"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">{bond.bondName}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{bond.bondId}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-2 h-4 w-4 text-primary",
                                                selectedBondId === bond.bondId ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
