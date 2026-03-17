package com.example.fgobattlesim.controller;

import com.example.fgobattlesim.dto.NoblePhantasmDto;
import com.example.fgobattlesim.dto.ServantDetailDto;
import com.example.fgobattlesim.service.FgoApiService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ServantController {

    private final FgoApiService service;

    public ServantController(FgoApiService service) {
        this.service = service;
    }

    @GetMapping("/")
    public String index(@RequestParam(required = false) Long servantId, Model model) {
        model.addAttribute("servants", service.getAllServants());
        model.addAttribute("selectedServantId", servantId);

        if (servantId != null) {
            ServantDetailDto servant = service.getServant(servantId);
            model.addAttribute("servant", servant);
            model.addAttribute("noblePhantasmName", firstNpName(servant));
        }

        return "index";
    }

    @GetMapping("/servants/{id}")
    public String servantDetails(@PathVariable Long id, Model model) {
        ServantDetailDto servant = service.getServant(id);
        model.addAttribute("servant", servant);
        model.addAttribute("noblePhantasmName", firstNpName(servant));
        return "servant";
    }

    private String firstNpName(ServantDetailDto servant) {
        if (servant.noblePhantasms() == null || servant.noblePhantasms().isEmpty()) {
            return "Unknown";
        }

        NoblePhantasmDto np = servant.noblePhantasms().get(0);
        return np.name() == null || np.name().isBlank() ? "Unknown" : np.name();
    }
}
